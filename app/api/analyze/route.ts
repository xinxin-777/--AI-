import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MOONSHOT_API_URL = 'https://api.moonshot.cn/v1/chat/completions';

interface RecognizedFood {
  name: string;
  estimatedAmount: string;
  unit: string;
}

function buildSystemPrompt(profile: {
  diseases: string[];
  allergies: string[];
  metrics: { fastingBloodSugar?: string; bloodPressure?: string };
}): string {
  const diseaseMap: Record<string, string> = {
    hypertension: '高血压',
    diabetes: '2型糖尿病',
    hyperuricemia: '高尿酸血症',
    hyperlipidemia: '高血脂',
  };
  const diseaseNames = profile.diseases.map((d) => diseaseMap[d] || d).join('、');
  const allergyText = profile.allergies.length > 0 ? profile.allergies.join('、') : '无';
  const metricsText = [
    profile.metrics.fastingBloodSugar
      ? `空腹血糖 ${profile.metrics.fastingBloodSugar} mmol/L`
      : '',
    profile.metrics.bloodPressure
      ? `血压 ${profile.metrics.bloodPressure} mmHg`
      : '',
  ]
    .filter(Boolean)
    .join('，');

  return `你是一位专业的临床营养师 AI 助手，专注于慢性病患者的饮食风险评估。
用户患有以下疾病：${diseaseNames || '无'}，过敏/禁忌：${allergyText}，参考指标：${metricsText || '无'}。

根据识别到的食物列表，请完成以下任务：
1. 综合评估本餐饮食对该患者的适合程度，给出 0-100 的评分（100分=完全适合）
2. 对每种食物标注风险等级（ok/warn/bad）和原因（15字以内）
3. 针对标注为 warn 或 bad 的食物，给出具体替代建议
4. 估算各营养素摄入量及占全日目标的百分比

以严格的 JSON 格式返回，不要输出任何其他内容，格式如下：
{
  "score": number,
  "scoreLevel": "excellent"|"good"|"caution"|"poor",
  "foods": [{"name": string, "amount": string, "riskLevel": "ok"|"warn"|"bad", "riskReason": string}],
  "suggestions": [{"original": string, "replacement": string, "benefit": string}],
  "nutrients": {
    "calories": {"value": number, "percentage": number},
    "sodium": {"value": number, "percentage": number},
    "protein": {"value": number, "percentage": number},
    "carbs": {"value": number, "percentage": number}
  }
}

营养素每日目标参考：热量1800kcal，钠2000mg，蛋白质65g，碳水250g。
对于高血压患者，钠的警戒线降低至1500mg。
对于糖尿病患者，碳水摄入超过60g/餐时标记warn。
scoreLevel规则：score>=80为excellent，>=65为good，>=45为caution，<45为poor。`;
}

async function recognizeFoodWithMoonshot(
  imageBase64: string,
  mimeType: string
): Promise<RecognizedFood[]> {
  const response = await fetch(MOONSHOT_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.MOONSHOT_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'moonshot-v1-8k',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`,
              },
            },
            {
              type: 'text',
              text: '请识别图中所有食物，返回JSON格式：[{"name": "食物名", "estimatedAmount": "估算量", "unit": "单位"}]，只返回JSON数组，不要其他内容。',
            },
          ],
        },
      ],
      temperature: 0.1,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Moonshot API error: ${err}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '[]';

  // Strip markdown code blocks if present
  const cleaned = content.replace(/```(?:json)?\s*/g, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleaned) as RecognizedFood[];
  } catch {
    return [{ name: '未识别食物', estimatedAmount: '1', unit: '份' }];
  }
}

function parseClaudeJSON(raw: string) {
  const cleaned = raw
    .replace(/```(?:json)?\s*/g, '')
    .replace(/```/g, '')
    .trim();
  return JSON.parse(cleaned);
}

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, mimeType, userProfile } = await request.json();

    if (!imageBase64 || !mimeType) {
      return NextResponse.json({ error: '缺少图片数据' }, { status: 400 });
    }

    // Step 1: Moonshot food recognition
    let foods: RecognizedFood[] = [];
    try {
      foods = await recognizeFoodWithMoonshot(imageBase64, mimeType);
    } catch (e) {
      console.error('Moonshot recognition failed:', e);
      foods = [{ name: '食物（识别失败）', estimatedAmount: '1', unit: '份' }];
    }

    const foodListText = foods
      .map((f) => `${f.name} ${f.estimatedAmount}${f.unit}`)
      .join('、');

    // Step 2: Claude analysis
    const systemPrompt = buildSystemPrompt(userProfile || { diseases: [], allergies: [], metrics: {} });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `本餐识别到的食物列表：${foodListText}。请按要求分析并返回JSON。`,
        },
      ],
    });

    const rawText = message.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('');

    const result = parseClaudeJSON(rawText);

    return NextResponse.json(result);
  } catch (error) {
    console.error('/api/analyze error:', error);
    return NextResponse.json(
      { error: '分析失败，请稍后重试' },
      { status: 500 }
    );
  }
}
