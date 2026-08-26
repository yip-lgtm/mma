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
- 按掣出分析報告（需要 MiniMax API key）

## LLM 分析報告

`/weight` →「產生今日報告」會打 MiniMax `MiniMax-Text-01` 出五段教練風格建議。`XAI_API_KEY` 已棄用，請改用：

| 環境變數 | 預設 | 用途 |
| --- | --- | --- |
| `MiniMax_API_KEY` | — | 必填。去 [platform.MiniMax.chat](https://platform.MiniMax.chat/user-center/basic-information/interface-key) 拎。 |
| `MiniMax_BASE_URL` | `https://api.MiniMax.chat/v1` | 留空用官方；指去自家 proxy / mock 都可以。 |
| `MiniMax_MODEL` | `MiniMax-Text-01` | 換做 `MiniMax-M1` 等推理型號。 |
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

`/weight` 嘅三個 section 都有 📷 上傳鈕，壓縮後直接打 MiniMax vision model：

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
./scripts/dev-with-mock.sh               # 自動指去 mock
# → http://localhost:8080
```

## 部署到 GitHub Pages（LLM 走 Worker proxy）

GitHub Pages 純靜態，server function 跑唔到。要用 LLM 上傳 + 分析報告，要喺 Cloudflare 整個 proxy worker 持有 API key，瀏覽器直接打 worker。

```
[Browser] --POST--> [Cloudflare Worker] --bearer--> [MiniMax API]
```

### 1. Deploy worker

```bash
cd workers/minimax-proxy
npm install
wrangler secret put MiniMax_API_KEY       # 貼你嘅 MiniMax key
wrangler deploy                            # 拎到 https://minimax-proxy.<acct>.workers.dev
```

可選：限制 CORS only 畀你個 origin：

```bash
wrangler secret put ALLOWED_ORIGIN
# 輸入 https://yip-lgtm.github.io
```

### 2. SPA 端用 proxy

```bash
# Build 時設 VITE_LLM_PROXY_URL，Vite 會 bake 入 bundle
VITE_LLM_PROXY_URL=https://minimax-proxy.<acct>.workers.dev/v1/chat/completions \
  npm run build:pages
```

`analyze.ts` 嘅 server function 喺靜態 build 唔會行 — `analyze-browser.ts` 鏡像直接 fetch 個 worker URL。Vite 會 tree-shake 走冇用嘅一邊（`VITE_LLM_PROXY_URL` 冇設就用 server function）。

如果冇設 proxy URL 又 deploy 咗靜態版，UI 會出：
> 靜態部署冇 LLM 後台。請設定 VITE_LLM_PROXY_URL（Cloudflare Worker）後重新 build，或用本機 `npm run dev`。

### 3. 本地用 worker 試

```bash
# Terminal 1: mock LLM（扮 MiniMax）
node scripts/mock-llm.mjs

# Terminal 2: wrangler dev
cd workers/minimax-proxy
npx wrangler dev    # 預設 .dev.vars 指去 localhost:9999

# Terminal 3: dev with browser path
VITE_LLM_PROXY_URL=http://127.0.0.1:8787/v1/chat/completions \
  ./scripts/dev-with-proxy.sh
```

`./scripts/dev-with-proxy.sh` 已經設好 `VITE_LLM_PROXY_URL`，可以直接行。

## 體能評級（9 分鐘）

| 距離 | 評級 |
| --- | --- |
| ≥ 2.10 km | 外圍型 |
| ≥ 1.80 km | 合格 |
| ≥ 1.50 km | 要補 |
| < 1.50 km | 太慢 |

目標體重 54.5 kg，上限 55 kg（168 cm）。
