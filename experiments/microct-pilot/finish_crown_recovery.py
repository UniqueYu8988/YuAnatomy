"""One finite resumable download followed by offline entry verification; no scheduler."""
import json,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parent;OUT=ROOT/'output/download-recovery'
status=OUT/'recovery-status.json';result=OUT/'recovery-run.json'
def write(state,**extra):
    temp=status.with_suffix('.tmp');temp.write_text(json.dumps({'state':state,**extra},indent=2));temp.replace(status)
write('downloading',note='Running a finite resumable download, then verifying cached entries.')
download=subprocess.run([sys.executable,str(ROOT/'recover_crown_download.py')],check=False)
run=json.loads(result.read_text()) if result.exists() else {'failures':[{'type':'MissingCompletionRecord','exitCode':download.returncode}]}
write('verifying-cached-entries',downloadFailures=run['failures'])
subprocess.run([sys.executable,str(ROOT/'extract_cached_crown.py')],check=True)
folder=ROOT/'source/cohort-389-1680';mp=folder/'manifest.json'
if not mp.exists():mp=folder/'manifest.partial.json'
manifest=json.loads(mp.read_text());missing=manifest.get('missingSections',[])
write('complete' if not missing else 'partial',verifiedCrownPNGCount=len(manifest['files']),
      missingCrownPNGCount=len(missing),sourceManifest=str(mp),downloadFailures=run['failures'],
      note='Individual entry CRCs verified. See whole-archive-validation.json for separate whole-ZIP verification. No anatomy reconstruction performed.')
print(status.read_text(),flush=True)
sys.exit(1 if missing else 0)
