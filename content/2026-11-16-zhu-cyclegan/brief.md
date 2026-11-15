## 一句話摘要
以對抗損失加上循環一致性損失，在沒有成對資料的情況下學習兩個影像領域間的雙向轉換，量化結果優於既有非成對方法。

## 研究問題
> 本筆記依據 arXiv:1703.10593v7（2020-08-24 版，正式發表於 ICCV 2017），頁碼皆為該 PDF 的頁序。

- 影像轉換（Image-to-Image Translation）的目標是學習輸入影像到輸出影像的映射，過去多仰賴成對（aligned）的訓練資料 (p.1, p.2)
- 成對資料難以取得且昂貴：語意分割資料集少且小、藝術風格化需要藝術家創作，物件變形（如斑馬↔馬）甚至沒有明確定義的「正確輸出」 (p.2)
- 本文要回答：只有兩個領域各自的影像集合 $\{x_i\}_{i=1}^N$、$\{y_j\}_{j=1}^M$、沒有一對一對應時，能否學到 $G: X \to Y$ (p.2, Fig. 2; p.4)
- 只用對抗損失的兩個問題 (p.2)：
  - 有無限多個映射 $G$ 能產生相同的輸出分布，不保證個別輸入與輸出有意義地對應 (p.2, p.4)
  - 單獨最佳化對抗目標實務上困難，常出現模式崩潰（mode collapse）：所有輸入都映射到同一張輸出 (p.2)

## 貢獻
> 原文沒有條列式的貢獻清單，以下整理自 Introduction 末段 (p.2)。
- 提出同時訓練 $G: X \to Y$ 與 $F: Y \to X$，並加入循環一致性損失，使 $F(G(x)) \approx x$、$G(F(y)) \approx y$；與兩個領域的對抗損失結合成非成對影像轉換的完整目標 (p.2)
- 將方法應用於集合風格轉換、物件變形、季節轉換、照片增強等多種任務 (p.2)
- 與依賴人工定義風格／內容分解或共享嵌入（shared embedding）的既有方法比較，作者宣稱表現優於這些 baseline (p.2)
- 提供 PyTorch 與 Torch 實作 (p.2)

## 方法
### 整體架構
- 兩個映射（生成器）$G: X \to Y$、$F: Y \to X$，兩個判別器 $D_X$、$D_Y$ (p.3 Fig. 3; p.4)
- $D_Y$ 區分真實 $y$ 與 $G(x)$；$D_X$ 區分真實 $x$ 與 $F(y)$ (p.4)
- 目標函數包含兩類：讓生成分布接近目標領域的對抗損失，以及避免 $G$、$F$ 互相矛盾的循環一致性損失 (p.4)

### 關鍵模組
- 前向循環一致性：$x \to G(x) \to F(G(x)) \approx x$ (p.3 Fig. 3b; p.4)
- 反向循環一致性：$y \to F(y) \to G(F(y)) \approx y$ (p.3 Fig. 3c; p.4)
- 作者在初步實驗中把 L1 換成 $F(G(x))$ 與 $x$ 之間的對抗損失，沒有觀察到改善 (p.4)
- 可以視為訓練兩個「自編碼器」（autoencoder）$F \circ G: X \to X$ 與 $G \circ F: Y \to Y$，中間表示是另一個領域的影像；也可視為對抗式自編碼器（adversarial autoencoder）的特例 (p.5)
- 恆等映射損失（Identity Mapping Loss）：只用在 painting→photo（以及附錄所述的照片增強），讓生成器在輸入已是目標領域影像時接近恆等映射，以保留顏色組成；作法取自 Taigman et al. [49] (p.8, p.9 Fig. 9, p.18)

### 關鍵公式
對抗損失 (p.4, Eq. 1)：
$$
\mathcal{L}_{GAN}(G, D_Y, X, Y) = \mathbb{E}_{y \sim p_{data}(y)}[\log D_Y(y)] + \mathbb{E}_{x \sim p_{data}(x)}[\log(1 - D_Y(G(x)))]
$$
- $G$ 最小化、$D_Y$ 最大化：$\min_G \max_{D_Y} \mathcal{L}_{GAN}(G, D_Y, X, Y)$；$F$ 與 $D_X$ 同理 (p.4)

循環一致性損失 (p.4, Eq. 2)：
$$
\mathcal{L}_{cyc}(G, F) = \mathbb{E}_{x \sim p_{data}(x)}[\lVert F(G(x)) - x \rVert_1] + \mathbb{E}_{y \sim p_{data}(y)}[\lVert G(F(y)) - y \rVert_1]
$$

完整目標 (p.4, Eq. 3) 與求解 (p.5, Eq. 4)：
$$
\mathcal{L}(G, F, D_X, D_Y) = \mathcal{L}_{GAN}(G, D_Y, X, Y) + \mathcal{L}_{GAN}(F, D_X, Y, X) + \lambda \mathcal{L}_{cyc}(G, F)
$$
$$
G^*, F^* = \arg\min_{G,F} \max_{D_X, D_Y} \mathcal{L}(G, F, D_X, D_Y)
$$
- $\lambda$：控制兩種目標的相對重要性，所有實驗設 $\lambda = 10$ (p.5)

恆等映射損失 (p.8)：
$$
\mathcal{L}_{identity}(G, F) = \mathbb{E}_{y \sim p_{data}(y)}[\lVert G(y) - y \rVert_1] + \mathbb{E}_{x \sim p_{data}(x)}[\lVert F(x) - x \rVert_1]
$$
- 權重為 $0.5\lambda$ (p.18)

### 網路架構與訓練細節
- 生成器沿用 Johnson et al. [23]：3 個卷積、數個殘差區塊（residual block）、2 個 stride 1/2 的分數步幅卷積、1 個映射到 RGB 的卷積；128×128 影像用 6 個區塊，256×256 以上用 9 個區塊；使用實例正規化（instance normalization） (p.5, p.18)
- 判別器：70×70 PatchGAN，判斷重疊的 70×70 區塊真假；參數較少且可處理任意尺寸影像 (p.5, p.18)
- 穩定訓練技巧一：$\mathcal{L}_{GAN}$ 以最小平方損失（least-squares loss）取代負對數概似 [35] (p.5)
- 穩定訓練技巧二：以最近 50 張生成影像的緩衝區更新判別器，減少震盪 [46] (p.5)
- Adam，batch size 1，learning rate 0.0002；前 100 epochs 固定，之後 100 epochs 線性降到 0 (p.5)
- 最佳化 $D$ 時目標除以 2，減緩 $D$ 相對 $G$ 的學習速度；權重以 $\mathcal{N}(0, 0.02)$ 初始化 (p.18)

## 實驗設定
- 資料集（量化評估，沿用 pix2pix [22] 的資料與指標）(p.5)：
  - Cityscapes labels↔photo：2975 張訓練影像，128×128，以 val set 測試 (p.18)
  - Maps↔aerial photo：1096 張訓練影像，取自 Google Maps，256×256，紐約市一帶，依緯度中位數切分訓練／測試 (p.18)
- 評估指標 (p.5–6)：
  - AMT 感知研究（「real vs fake」）：每個演算法 25 位受試者，每次 10 次練習＋40 次正式測試，數字不可與 [22] 直接比較 (p.5–6)
  - FCN score：以現成 FCN [33] 對生成照片做語意分割，再與輸入標籤比較；用於 labels→photo (p.6)
  - 語意分割指標（photo→labels）：per-pixel accuracy、per-class accuracy、Class IOU (p.6)
- 比較基準 (p.6–7)：CoGAN [32]、SimGAN [46]、Feature loss + GAN（SimGAN 變體，在 VGG-16 relu4_2 特徵空間算 L1）、BiGAN/ALI [9, 7]、pix2pix [22]（使用成對資料，當作「上限」）
  - 除 CoGAN 使用公開實作外，所有 baseline 都用與本文相同的架構與細節實作 (p.7)
- 應用任務資料 (p.8, p.13, p.18)：
  - 物件變形：ImageNet，horse 939、zebra 1177、apple 996、orange 1020 張，256×256 (p.13, p.18)
  - 季節轉換：Flickr Yosemite，summer 1273、winter 854 張 (p.8, p.18)
  - 集合風格轉換：WikiArt 畫作＋Flickr 風景照。p.8 正文寫 Cezanne 526、Monet 1073、Van Gogh 400、Ukiyo-e 563；p.18 附錄寫 Monet 1074、Cezanne 584、Van Gogh 401、Ukiyo-e 1433、Photographs 6853 [待確認]（正文與附錄數字不一致，投影片不引用此數字）
  - 照片增強：Flickr 花卉照，smartphone 1813、DSLR 3326 張 (p.18)

## 主要結果
### 與 baseline 比較
- AMT（Table 1, p.7）：CycleGAN 在 Map→Photo 騙過 26.8% ± 2.8%、Photo→Map 23.2% ± 3.4% 的受試者；所有 baseline 都在 2.6% 以下（最高為 SimGAN Photo→Map 2.6% ± 1.1%）(p.7)
- 512×512 解析度（註 3, p.7）：maps→aerial photos CycleGAN 37.5% ± 3.6%、pix2pix 33.9% ± 3.1%；aerial photos→maps CycleGAN 16.5% ± 4.1%、pix2pix 8.5% ± 2.6% (p.7)
- Cityscapes labels→photo FCN score（Table 2, p.7）：CycleGAN 0.52 / 0.17 / 0.11（per-pixel / per-class / Class IOU），最佳 baseline CoGAN 0.40 / 0.10 / 0.06，pix2pix 0.71 / 0.25 / 0.18 (p.7)
- Cityscapes photo→labels（Table 3, p.7）：CycleGAN 0.58 / 0.22 / 0.16，pix2pix 0.85 / 0.40 / 0.32；baseline per-pixel 介於 0.41～0.50 (p.7)
- 作者結論：baseline 都無法得到令人信服的結果，CycleGAN 常可達到接近完全監督 pix2pix 的品質 (p.7)

### 消融實驗（Table 4、5, p.7；Fig. 7, p.8）
| 設定 | L→P per-pixel | L→P Class IOU | P→L per-pixel | P→L Class IOU |
|---|---|---|---|---|
| Cycle alone | 0.22 | 0.02 | 0.10 | 0.02 |
| GAN alone | 0.51 | 0.08 | 0.53 | 0.07 |
| GAN + forward cycle | 0.55 | 0.12 | 0.49 | 0.07 |
| GAN + backward cycle | 0.39 | 0.06 | 0.01 | 0.01 |
| CycleGAN (ours) | 0.52 | 0.11 | 0.58 | 0.16 |
- 作者指出：移除 GAN loss 或 cycle loss 都會明顯變差，兩者都關鍵 (p.7)
- 只有單向 cycle loss 時常造成訓練不穩定與模式崩潰，尤其是被移除的那個方向 (p.7)
- Fig. 7：Cycle alone 與 GAN + backward 產生不像目標領域的影像；GAN alone 與 GAN + forward 發生模式崩潰，不論輸入都產生相同的標籤圖 (p.8)
- 注意：labels→photo 上 GAN + forward cycle（0.55 / 0.18 / 0.12）略高於完整 CycleGAN（0.52 / 0.17 / 0.11），原文未特別討論 (p.7)

### 其他分析
- 重建品質：$F(G(x))$ 在訓練與測試時都常接近輸入 $x$（Fig. 4）(p.4, p.7)
- 其他成對資料集（CMP Facade、UT Zappos50K edges↔shoes）：作者指出品質接近 pix2pix（Fig. 8）(p.8)
- 應用：集合風格轉換（Fig. 10、11）、物件變形與季節轉換（Fig. 13）、畫作→照片（Fig. 12）、照片增強／淺景深（Fig. 14）(p.8–14)
- 恆等映射損失：沒有它時，生成器常把白天的畫作變成日落照片；加入後可保留輸入顏色（Fig. 9）(p.9)
- 與 Gatys et al. [13] 神經風格轉換比較：Gatys 需要找到與目標相近的風格影像，且常無法產生逼真結果；CycleGAN 可產生接近目標領域的自然結果（Fig. 15、16）(p.9)
- 作者提醒：訓練資料上的轉換常比測試資料好看 (p.8)；Fig. 9、12 為訓練集上的結果 (p.9)

## 限制
- 作者指出：涉及顏色與紋理的任務常成功，但需要幾何變形的任務幾乎不成功，例如 dog→cat 只做出極小的改變；可能是生成器架構偏向外觀變化 (p.9, Fig. 17)
- 作者指出：訓練資料分布會造成失敗，例如 horse→zebra 遇到騎馬的人，因 ImageNet 的 wild horse／zebra 類別沒有騎乘影像 (p.9, Fig. 17)
- 作者指出：與成對資料方法仍有差距；photo→labels 有時會把 tree 與 building 標籤互換，可能需要弱語意監督 (p.9)
- 作者指出：照片增強只展示最成功的結果，平均表現明顯較差 (p.14, Fig. 14)
- 報告人觀點：量化評估只在 Cityscapes 與 Google Maps 兩個有成對答案的資料集上進行，多數應用任務只有定性結果
- 報告人觀點：labels→photo 消融中 GAN + forward cycle 的分數略高於完整模型，雙向循環的優勢主要表現在 photo→labels

## 圖表清單
| 編號 | 頁碼 | 內容 | 是否使用 |
|---|---|---|---|
| Fig. 1 | p.1 | 非成對轉換示例（Monet↔photo、zebra↔horse、summer↔winter、多位畫家風格） | ✅ 放圖 |
| Fig. 2 | p.2 | 成對 vs 非成對訓練資料示意 | ✅ 改寫成文字 |
| Fig. 3 | p.3 | 模型架構：$G$、$F$、$D_X$、$D_Y$ 與前向／反向循環一致性 | ✅ 放圖 |
| Fig. 4 | p.4 | 輸入、輸出與重建影像 | ❌ |
| Fig. 5 | p.6 | Cityscapes labels↔photos 各方法比較 | ❌ |
| Fig. 6 | p.6 | Google Maps aerial↔maps 各方法比較 | ❌ |
| Table 1 | p.7 | AMT real vs fake 結果 | ✅ 重打成表格 |
| Table 2 | p.7 | Cityscapes labels→photo FCN score | ✅ 重打成表格 |
| Table 3 | p.7 | Cityscapes photo→labels 分割指標 | ✅ 重打成表格 |
| Table 4 | p.7 | 消融：labels→photo FCN score | ✅ 重打成表格 |
| Table 5 | p.7 | 消融：photo→labels 分割指標 | ✅ 重打成表格 |
| Fig. 7 | p.8 | 消融的定性比較 | ✅ 放圖 |
| Fig. 8 | p.8 | 其他成對資料集（facade、edges↔shoes） | ❌ |
| Fig. 9 | p.9 | 恆等映射損失的效果 | ✅ 放圖 |
| Fig. 10 | p.10 | 集合風格轉換 I | ❌ |
| Fig. 11 | p.11 | 集合風格轉換 II | ❌ |
| Fig. 12 | p.12 | Monet 畫作→照片 | ❌ |
| Fig. 13 | p.13 | 物件變形與季節轉換 | ✅ 放圖（節錄上四列） |
| Fig. 14 | p.14 | 照片增強（淺景深） | ❌ |
| Fig. 15 | p.14 | 與 Gatys et al. 的照片風格化比較 | ❌ |
| Fig. 16 | p.15 | 與 Gatys et al. 在其他任務的比較 | ❌ |
| Fig. 17 | p.15 | 典型失敗案例 | ✅ 改寫成文字 |

## 術語表
| 中文 | English | 說明 |
|---|---|---|
| 影像轉換 | Image-to-Image Translation | 把同一場景的一種影像表示轉成另一種，例如標籤圖→照片 |
| 非成對資料 | Unpaired Data | 兩個領域各自的影像集合，不知道哪張對應哪張 |
| 生成對抗網路 | Generative Adversarial Network (GAN) | 生成器與判別器互相對抗訓練的生成模型 |
| 生成器 | Generator | 負責產生（轉換）影像的網路，本文為 $G$、$F$ |
| 判別器 | Discriminator | 判斷影像是真實或生成的網路，本文為 $D_X$、$D_Y$ |
| 對抗損失 | Adversarial Loss | 讓生成影像的分布與目標領域無法區分的損失 |
| 循環一致性損失 | Cycle Consistency Loss | 轉換到另一領域再轉回來，要與原圖相近（L1 距離） |
| 恆等映射損失 | Identity Mapping Loss | 輸入已是目標領域影像時，要求生成器幾乎不改變它 |
| 模式崩潰 | Mode Collapse | 生成器對所有輸入都產生相同或極少種輸出 |
| 最小平方 GAN | Least-Squares GAN (LSGAN) | 以平方誤差取代對數概似的 GAN 損失，訓練較穩定 |
| 區塊判別器 | PatchGAN | 對影像中重疊的小區塊分別判斷真假的判別器 |
| 實例正規化 | Instance Normalization | 對每張影像各自做正規化，常用於風格轉換 |
| 殘差區塊 | Residual Block | 帶有捷徑連接的卷積區塊 |
| 消融實驗 | Ablation Study | 逐一移除模型元件，觀察各元件貢獻的實驗 |
| 神經風格轉換 | Neural Style Transfer | 以預訓練特徵的 Gram matrix 統計，把單張畫作風格套到照片上 |
| 物件變形 | Object Transfiguration | 把一類物件轉成另一類，例如馬→斑馬 |
| 集合風格轉換 | Collection Style Transfer | 學習整個藝術家作品集合的風格，而非單一作品 |
| FCN 分數 | FCN Score | 用現成語意分割網路判斷生成照片可被辨識的程度 |

## 投影片大綱
| 頁 | 類型 | 標題 | 來源 |
|---|---|---|---|
| 1 | cover | — | p.1 |
| 2 | info | 論文資訊 | p.1 |
| 3 | bullets | 報告大綱 | — |
| 4 | section | 01 研究背景與動機 | — |
| 5 | figure | CycleGAN 能在兩組沒有對應關係的影像集合間互相轉換 | p.1, Fig. 1 |
| 6 | compare | 成對資料昂貴甚至不存在，本文只用兩組非成對影像 | p.2, Fig. 2 |
| 7 | bullets | 只靠對抗損失，無法保證每張輸入對應到合理的輸出 | p.2, p.4 |
| 8 | takeaway | 本文貢獻（同時學習 G 與 F，要求轉過去還能轉回來） | p.2 |
| 9 | compare | 循環一致性早有先例，本文把它用在影像轉換 | p.3 |
| 10 | table | CycleGAN 不需成對資料，也不需預先定義相似度 | p.3–4 |
| 11 | section | 02 研究方法與實驗設定 | — |
| 12 | figure | CycleGAN 用兩組生成器與判別器互相約束 | p.3, Fig. 3 |
| 13 | equation | 對抗損失讓轉換結果與目標領域無法區分 | p.4, Eq. 1 |
| 14 | equation | 循環一致性損失要求轉換兩次後回到原圖 | p.4, Eq. 2 |
| 15 | equation | 完整目標以 λ 平衡對抗損失與循環一致性損失 | p.4–5, Eq. 3–4 |
| 16 | figure | 恆等映射損失讓畫作轉照片時保留原本的顏色 | p.8–9, Fig. 9, p.18 |
| 17 | bullets | 生成器沿用 Johnson et al.，判別器採用 70×70 PatchGAN | p.5, p.18 |
| 18 | bullets | 以最小平方損失與影像緩衝區穩定訓練 | p.5, p.18 |
| 19 | bullets | 在 Cityscapes 與 Google Maps 上以人眼與 FCN 分數評估 | p.5–6, p.18 |
| 20 | table | 比較四種非成對 baseline，並以成對的 pix2pix 為上限 | p.6–7 |
| 21 | section | 03 實驗結果與討論 | — |
| 22 | table | CycleGAN 騙過約四分之一的受試者，baseline 都低於 3% | p.7, Table 1 |
| 23 | table | CycleGAN 在 Cityscapes 雙向任務都優於 baseline，但仍落後 pix2pix | p.7, Table 2–3 |
| 24 | table | 消融實驗：對抗損失與循環一致性損失缺一不可 | p.7, Table 4–5 |
| 25 | figure | 只用單一損失或單向循環，會產生錯誤領域或模式崩潰 | p.8, Fig. 7 |
| 26 | figure | 沒有成對資料的物件變形與季節轉換也能運作 | p.13, Fig. 13（節錄上四列） |
| 27 | bullets | 討論與限制 | p.9, p.14, Fig. 17 |
| 28 | todo | 個人評論 | — |
| 29 | section | 04 結論 | — |
| 30 | takeaway | 結論 | p.7, p.9 |
| 31 | qa | Q & A | — |
| 32 | refs | 參考文獻 | p.16–17 |
