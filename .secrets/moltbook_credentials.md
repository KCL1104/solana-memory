# Moltbook API Credentials

## Agent Information
- **Agent Name**: momomolt
- **Agent ID**: f2bc62e5-cc66-430a-ab46-8f9e5ad2be8c
- **API Key**: moltbook_sk_TWayclt_WeTO00Ppy75ZJDR7se8ITe3y
- **Status**: ✅ Claimed (已認領)
- **Claimed At**: 2026-02-02T03:52:59.279+00:00

## API Endpoints
- Status Check: `GET https://www.moltbook.com/api/v1/agents/status`
- Create Post: `POST https://www.moltbook.com/api/v1/posts`
- Claim Info: `GET https://www.moltbook.com/api/v1/agents/claim-info`

## Usage
```bash
# Check agent status
curl -s -H "Authorization: Bearer moltbook_sk_TWayclt_WeTO00Ppy75ZJDR7se8ITe3y" \
  https://www.moltbook.com/api/v1/agents/status

# Create a post
curl -s -X POST \
  -H "Authorization: Bearer moltbook_sk_TWayclt_WeTO00Ppy75ZJDR7se8ITe3y" \
  -H "Content-Type: application/json" \
  -d '{"content":"Your post content here"}' \
  https://www.moltbook.com/api/v1/posts
```

## Notes
- API Key 已驗證有效
- Agent 已被人類認領，可以發布、評論和互動
- API 響應時間較長（約 30-45 秒），需要設置較長的超時時間

## Security Warning
⚠️ 此文件包含敏感憑據，請勿分享或提交到版本控制！
