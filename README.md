# 蝶刺

香港康文署 30 分鐘外圍拳擊自學：阿里／洛馬琴科移動 + 每日引體／胸／二頭／腹塑形。體重、飲食、體脂磅、每週一次 9 分鐘耐力跑。

## 本機

```bash
git clone git@github.com:yip-lgtm/mma.git
cd mma
npm install
npm run dev
```

然後開 [http://localhost:8080](http://localhost:8080)。資料存在瀏覽器，唔使登入。

## GitHub Pages

線上： [https://yip-lgtm.github.io/](https://yip-lgtm.github.io/)

推 `main` 會更新 `mma` 嘅 `gh-pages` 分支。GitHub Pages 係靜態站，訓練／體重／9 分鐘跑可用；LLM 飲食報告要本機 `npm run dev`。

```bash
npm run build
npm run preview
```

## 功能

- 七日移動課表（速度、旋轉、單腳、有氧、刺拳）
- 每日後半 12 分鐘塑形：引體、胸、二頭、腹 × 3 輪
- 康文署第一／第三個星期二改戶外徒手
- 體脂磅記錄 + 飲食
- 每週任一日 9 分鐘耐力跑（香港體適能協議）
- 按掣出分析報告（需要 OpenAI API key）

## LLM 分析報告

`/weight` →「產生今日報告」會打 OpenAI chat completion（`gpt-4o-mini` 預設）出五段教練風格建議。`XAI_API_KEY` / `MiniMax_API_KEY` 已棄用，請改用：

| 環境變數 | 預設 | 用途 |
| --- | --- | --- |
| `OPENAI_API_KEY` | — | 必填。去 [platform.openai.com](https://platform.openai.com/account/api-keys) 拎。 |
| `OPENAI_BASE_URL` | `https://api.openai.com/v1` | 留空用官方；指去自家 proxy / mock 都可以。 |
| `OPENAI_MODEL` | `gpt-4o-mini` | 換做 `gpt-4o` 等更強 model。 |
| `AUTO_GIT_PUSH` | `0` | 設成 `1` 就會喺報告生成後 `git push` 去 origin。 |
| `GIT_AUTHOR_NAME` | `蝶刺 bot` | 自動 commit 用嘅 author name。 |
| `GIT_AUTHOR_EMAIL` | `bot@dieci.local` | 自動 commit 用嘅 author email。 |

報告會寫入 `reports/YYYY-MM-DD.md`，然後 commit。`AUTO_GIT_PUSH=1` 會再多做 `git push`。用本機 ssh key 或 HTTPS + PAT 都可以，例如：

```bash
# 一次性
gh auth setup-git

# 或者用 PAT
git remote set-url origin https://x-access-token:<PAT>@github.com/yip-lgtm/mma.git
```

冇 git 認證時 push 會靜靜失敗，唔會影響報告本身（檔案同 commit 已經落地）。

### 視覺抽取（體脂磅 / 食物 / 跑距）

`/weight` 嘅三個 section 都有 📷 上傳鈕，壓縮後直接打 OpenAI vision-capable model：

| 上傳 | 抽出 | Server function |
| --- | --- | --- |
| 體脂磅截圖 | 25 個 metrics + health + bodyType | `extractBodyScanFromImage` |
| 食物相 | HK 風格短句（按餐別） | `identifyFoodFromImage` |
| 跑步機／App 截圖 | `{meters, durationSec}` | `extractRunFromImage` |

Mock 自動按 user text 路由 — 含「跑步／run／跑距／耐力」就回跑距 JSON。

### 開發用 mock LLM

唔想燒 API credit 試 flow：

```bash
node scripts/mock-llm.mjs &              # 9999 埠
./scripts/dev-with-mock.sh               # 自動指去 mock (model: gpt-4o-mini)
# → http://localhost:8080
```


## 體能評級（9 分鐘）

| 距離 | 評級 |
| --- | --- |
| ≥ 2.10 km | 外圍型 |
| ≥ 1.80 km | 合格 |
| ≥ 1.50 km | 要補 |
| < 1.50 km | 太慢 |

目標體重 54.5 kg，上限 55 kg（168 cm）。
