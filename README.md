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

線上： [https://yip-lgtm.github.io/mma/](https://yip-lgtm.github.io/mma/)

推 `main` 會自動部署。GitHub Pages 係靜態站，訓練／體重／9 分鐘跑可用；LLM 飲食報告要本機 `npm run dev`。

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
- 按掣先出分析報告（需要 xAI API）

## 體能評級（9 分鐘）

| 距離 | 評級 |
| --- | --- |
| ≥ 2.10 km | 外圍型 |
| ≥ 1.80 km | 合格 |
| ≥ 1.50 km | 要補 |
| < 1.50 km | 太慢 |

目標體重 54.5 kg，上限 55 kg（168 cm）。
