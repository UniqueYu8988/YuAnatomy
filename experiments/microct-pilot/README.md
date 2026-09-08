# micro-CT 真实标本重建试验

此目录独立于正式应用。不修改既有牙体、示意髓腔和模型索引。

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
