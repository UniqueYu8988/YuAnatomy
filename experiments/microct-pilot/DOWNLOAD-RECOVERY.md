# 标本 045 下载恢复记录

2026-09-09。目标是补回同一原始档案的缺失数据，复用缓存，不换成来源不明的模型。

## 最终结果：完整恢复

此前缺失的 781 张切片已全部补齐。三个区间合起来为 **source 389–2973，共 2585 张 PNG，缺层为零**；所有提取文件的 SHA-256 均与各自清单匹配。冠方 389–1680 的 1292 个 ZIP 条目全部通过长度与 CRC 校验。

进一步补取 ZIP 首尾小段，流式核验整个 2949420834 字节档案，结果与发布方记录完全一致：

- MD5：`a021111311befc6a287e9eeb3a02b875`
- SHA-256：`e11b48bea12dde2058f9f6b7c9b02d116c7645bbcddea565ee3d0d35c5f6b081`

验证记录为 `output/download-recovery/source-coverage-validation.json`、`whole-archive-validation.json`。现在不仅验证了局部图片，也验证了完整原始档案。没有再保存一份 2.95 GB 的重复 ZIP。

本轮完成的是数据恢复；此前 `paired-specimen-partial` 的粉色缺层预览仍是历史输出，尚未自动用完整数据重建，也不代表已经恢复了完整髓室。

## 已核实的公开入口

1. 作者原入口：https://osf.io/fqm4x/download
2. OSF 官方文件记录给出的入口：https://osf.io/download/fqm4x/
3. 官方元数据列出的文件服务地址：https://files.de-1.osf.io/v1/resources/rt3da/providers/osfstorage/5f5095a8ae5a9500586e33a4

本轮三个入口均成功返回 `206 Partial Content` 的 ZIP 字节段。档案大小 2949420834 字节，存储端 ETag 与已缓存版本一致。第三个入口的 HEAD Content-Length 与实际 ZIP 总长不一致，因此不能据此截断下载；以 GET 的 Content-Range 和官方文件记录交叉核验。

探测记录：`output/download-recovery/entry-probes.json`。

## 恢复方法

- 每个请求只取 4 MiB，经官方公开入口重新获得重定向，不保存签名 URL 供后续反复使用。
- 实测签名链接剩余有效期约 59 秒，服务端与本地时间差不到 1 秒。记录在 `signature-lifetime-probes.json`。这说明及时刷新链接有必要，**不能反推此前全部 403 都由过期造成**。
- 初始采用两个请求并发，确认多个小分块成功后使用最多四个并发；可用 `--workers 1` 至 `--workers 4` 调整。
- 每个小分块检查状态、精确范围、长度与 ETag，再原子写入缓存；组成原有 16 MiB 缓存块后继续复用旧流程。
- 401/403 不自动重试，并取消排队请求。暂时网络错误最多有限次重试。未使用账户、Cookie、代理或绕过访问限制。
- 下载结束后离线验证 ZIP 条目的 CRC、解压长度与文件 SHA-256；缺层未归零前不能称完整下载。

一次中断后发现旧下载进程已不在、也没有完成记录。因此增加了原子写入的 `recovery-progress.json`，并提供下载与校验串行执行的入口。缓存可在进程中断后再次复用，但不能保证桌面应用或电脑关闭后任务仍运行。

## 状态与复现

在项目根目录运行：

```powershell
python experiments/microct-pilot/finish_crown_recovery.py
```

它执行有限的一次续传，然后核验现有完整条目。执行状态在 `output/download-recovery/recovery-status.json`；传输过程在 `recovery-progress.json`；结束记录在 `recovery-run.json`。这些 JSON 比旧阶段报告中的缺层快照更新。

只核验本地缓存、不请求网络：

```powershell
python experiments/microct-pilot/extract_cached_crown.py
```

全部区间可用后，还可用 `verify_cohort_zip_hash.py` 取得很小的 ZIP 首尾缺段，再流式核对整个档案的发布方 MD5 和 SHA-256，不需要另存一份完整 ZIP。

## 镜像检索结果

[作者仓库](https://github.com/habi/zmk-tooth-cohort) 的下载内容仍指向 OSF。[作者稿的数据可用性说明](https://habi.github.io/zmk-tooth-cohort-method-manuscript/#availability-of-data-and-materials) 只公开两个示例，其余数据需向作者申请。本轮官方项目文件列表也只有 `7.zip`、`45.zip`，没有找到额外的独立镜像或整批根管标签。

`Tooth045.mlab` 是可视化工程，引用作者本地 `Tooth045_pulpa.mlimage` 等文件；不是已包含这些扫描数据的自包含模型。没有执行第三方工程或 notebook，也未联系作者。

另有后续研究线索：作者稿图 4 将标本 045 记为 `1-2-2/2`。这是作者采用的四位描述，不能直接视作本次候选模型已验证的分型，也不能替代缺失切片的证据。

来源与再分发许可状态继续见 [COHORT-ATTRIBUTION.md](COHORT-ATTRIBUTION.md)。
