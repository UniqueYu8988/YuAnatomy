# 第五轮：取得独立10μm标本的真实切片

2026-09-08。此次没有继续调节Tomo1B，也没有修改网页。取得第二来源的原始重建图，验证下载、尺度与研究价值。

## 来源和许可

- 论文：Haberthür等，Automated segmentation and description of the internal morphology of human permanent teeth by means of micro-CT (2021)，https://pmc.ncbi.nlm.nih.gov/articles/PMC8040229/ 。研究对象为104颗恒下颌尖牙；论文公开两个示例，不能声称取得全部104颗牙。
- 作者仓库：https://github.com/habi/zmk-tooth-cohort 。从DownloadFromOSF.ipynb读取公开下载链接，未执行第三方notebook。
- 本次文件：OSF https://osf.io/fqm4x/download ，45.zip。**45是标本编号，不是FDI牙位45。**
- OSF项目rt3da的官方API显示public=true，node_license=null，license关系为空；Zenodo代码归档仅标other-open。当前许可不足以宣称可以将数据直接随软件再发布。仅保留本地研究副本，来源数据不纳入Git，不并入基础CC BY模型素材。

## 实际取得的内容

完整ZIP大小2949420834字节，含2593条目，其中2585张重建PNG，文件序号389–2973。源扫描/重建日志已保存；重建日志记载Pixel Size=9.99999μm、层步长1、图像1632×1632、PNG格式。实际9张样本均为8bit灰度图；不能把采集投影日志的16bit误报为重建图16bit。

通过公开下载服务的HTTP Range读取ZIP目录及指定条目，无需下载整包。取得9张等间隔切片：389、712、1035、1358、1681、2004、2327、2650、2973，并保留7个日志文件。ZIP条目CRC已核验，各图SHA256写入output/cohort-screening/report.json。最后一次成功运行传输约7.93MB（复用前次缓存）；此数字不包含此前失败尝试及缓存下载量。

完整包发布方SHA256为e11b48bea12dde2058f9f6b7c9b02d116c7645bbcddea565ee3d0d35c5f6b081，MD5为a021111311befc6a287e9eeb3a02b875。尚未下载整包，故没有核验整包哈希。9张稀疏样本不能作为连续体积重建。

## 图像筛查发现

1. 文件2004、2327、2650可见两个分离的低密度腔隙；1681可见细长暗区。支持选为后续分叉/分合追踪候选，但还不能从稀疏样本认定两条连续根管、具体分型或出口数。
2. 冠部712处可见明显分离样暗隙，图中还存在环状与条纹伪影。原因尚未确定，因此暂不作为“正常完整牙”的默认教学标本。
3. 10μm标注已有文件内日志支持，但不等于10μm真实空间分辨率或边界准确度。比上一标本更细的采样也不保证更好的整体图像质量。
4. 首末抽样仅见背景/承载介质。本次contact-sheet按各图百分位调窗，背景被放亮是显示结果，不是新增组织；原PNG没有改动。

## 对作者方法的核查

ToothAnalysis.ipynb中的pulponator使用Otsu阈值、clear_border移除连接图像边缘的暗区，再remove_small_objects(min_size=64)与remove_small_holes(area_threshold=100)。这可借鉴批处理方式，但同样具有排除开放通路和微小结构的可能。不能因发表于论文就认为它已解决我们的根尖开放边界问题。

## 下一步实验

优先取得1681–2004附近的连续重建切片，先确定双腔隙何处形成，再检查它们的三维连接。原始灰度、候选分割、方法分歧分别保存，避免以孤立横断面直接标分型。尖端另设连续ROI，不将背景生长结果当髓腔。

另一路Dryad的2μm候选，在正常浏览器点击官方README下载后仍返回403；API下载401。此入口当前不可用，没有绕过认证。Zenodo15396214实际仅提供Atlas.pdf，不是可直接重建的体数据；不将图谱截图当成原始扫描替代品。

## 复现和产物

运行 `python experiments/microct-pilot/screen_cohort.py`。脚本检查206及Content-Range、条目CRC、读取大小上限；遇临时签名过期从公开入口重新获取链接，缓存通过CRC才复用。

- source/cohort-screening：原图、日志、OSF元数据、ZIP索引、作者notebook供阅读。
- output/cohort-screening/report.json：抽样统计及逐图哈希。
- output/cohort-screening/contact-sheet.png：九图调窗总览，只用于本地研究。
- 原应用check/validate/build已通过；未修改应用代码与模型。
