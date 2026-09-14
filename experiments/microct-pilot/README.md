# micro-CT 真实标本重建试验

此目录独立于正式应用。不修改既有牙体、示意髓腔和模型索引。

最新结果（2026-09-11）：[第二颗下颌尖牙 007 筛选](SPECIMEN007-SELECTION-RESULTS.md)。已取得 350 张原图，其中 1100–1434 为连续 335 层；原图和轻度平滑在阈值 25/30 下支持连续主体。已导出局部候选和方法分歧，通过文件与几何核验。007 值得进入全标本验证，但尚未取得全 3002 张切片，也未完成完整髓室或根管系统。

前一轮：[冠方环纹与保边去噪对照](CROWN-ARTIFACT-RESULTS.md)。完成 301 层、5 种处理、3 阈值及 120 条合成对照；环纹减轻，但连续冠方终点未改善，弱对比微小结构存在误删风险，因此不替换旧候选。新增未经处理的局部 NRRD 复核包。

上一阶段：[完整切片配对与冠方连通性审计](FULL-SPECIMEN-RESULTS.md)。已生成完整源范围的同标本牙体包络与髓腔候选，5 个 NRRD、两套 PLY 和源坐标抽样核验通过。完整髓室仍未可靠恢复；阈值 30 的冠方主体从 1383 层开始，另有 51 个孤立候选体素，不补连。

下载已完整恢复：2585 张 PNG 无缺层，完整 ZIP 的 MD5 与 SHA-256 均匹配发布方记录。见 [DOWNLOAD-RECOVERY.md](DOWNLOAD-RECOVERY.md)；下面的缺层数字和局部预览是对应阶段的历史快照。

历史尝试：[冠部扩展与同标本配对](CROWN-PAIRING-RESULTS.md)。当时新增 509 张冠方影像，复用两张稀疏图；源服务 403 后停止下载，仍缺 781 层。`output/paired-specimen-partial/` 保留当时的缺层快照。

最新阶段（2026-09-09）：[标本 045 连续根部重建、共同腔隙及候选出口复核](ROOT-SYSTEM-STAGE-REPORT.md)。本阶段已取得 1293 层连续影像，离线原图、标签和三维候选位于 `output/root-study/`。该标本的 [许可状态](COHORT-ATTRIBUTION.md) 与下述 Tomo1B 不同，不能混用。

来源：Pereira 等，ds-uct-002，Tomo1B（发布方标注为治疗前）。
DOI：https://doi.org/10.5281/zenodo.3877625
许可：CC BY 4.0，https://creativecommons.org/licenses/by/4.0/

原始文件与元数据保留在 `source/`，中间体数据在 `cache/`，实验模型与核对图在 `output/`。这三个目录不纳入 Git。

## 运行

1. `python experiments/microct-pilot/fetch.py` 下载并核对发布方 MD5，保存 SHA256。
2. `python experiments/microct-pilot/inspect_volume.py` 检查切片和文件元数据。
3. `python experiments/microct-pilot/reconstruct.py` 重建并比较三个阈值。
4. `python experiments/microct-pilot/make_preview.py` 生成全部切片和本地三维预览（需要已有 node_modules/three）。
5. `python experiments/microct-pilot/validate.py` 核验来源、配准、分割和网格。
6. `python -m http.server 3026 --bind 127.0.0.1 --directory experiments/microct-pilot/output`，浏览器打开 http://127.0.0.1:3026 。以上命令均在项目根目录执行。

实验结论与限制见 [EXPERIMENT-REPORT.md](EXPERIMENT-REPORT.md)。结果不是医学审校通过的模型。

Python 数值库沿用项目 `work/pulp-runtime`。源说明及 ZIP 名为20微米；ZIP内部目录名包含10微米。暂按源说明使用0.020mm等方体素，尺度存在待澄清项。

实验中低密度腔隙不等于存活牙髓组织。原图中的裂隙、伪影、标本处理痕迹不得自行解释成侧支根管。没有明确牙位元数据前，不强行指定 FDI 编号。
