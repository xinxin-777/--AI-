import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { weeklyData, userProfile } = await request.json();

    const diseaseMap: Record<string, string> = {
      hypertension: '高血压',
      diabetes: '2型糖尿病',
      hyperuricemia: '高尿酸血症',
      hyperlipidemia: '高血脂',
    };
    const diseases = (userProfile?.diseases || [])
      .map((d: string) => diseaseMap[d] || d)
      .join('、');

    const prompt = `你是一位专业营养师。根据以下用户本周饮食数据，给出下周的饮食建议（100-150字）：

用户病种：${diseases || '无'}
本周平均评分：${weeklyData.averageScore || 0}分
打卡天数：${weeklyData.checkedDays || 0}天
高风险餐次：${weeklyData.highRiskMeals || 0}次
高频风险食材：${weeklyData.topRiskFoods?.join('、') || '无'}

请直接给出建议文字，语气亲切，具有针对性，不要包含任何格式符号或标题。`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    });

    const advice = message.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('');

    return NextResponse.json({ advice });
  } catch (error) {
    console.error('/api/weekly-advice error:', error);
    return NextResponse.json(
      { error: '获取建议失败，请稍后重试' },
      { status: 500 }
    );
  }
}
