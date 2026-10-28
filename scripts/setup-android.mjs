import fs from 'node:fs';
import path from 'node:path';

const pkgDir = path.join('android','app','src','main','java','com','roozyar','personal');
fs.mkdirSync(pkgDir, { recursive: true });
fs.copyFileSync(path.join('native','RoozYarSaveFilePlugin.java'), path.join(pkgDir,'RoozYarSaveFilePlugin.java'));

const mainPath = path.join(pkgDir,'MainActivity.java');
let main = fs.readFileSync(mainPath,'utf8');
if (!main.includes('registerPlugin(RoozYarSaveFilePlugin.class)')) {
  if (!main.includes('import android.os.Bundle;')) main = main.replace(/(package [^;]+;\s*)/, '$1\nimport android.os.Bundle;\n');
  main = main.replace(/public class MainActivity extends BridgeActivity\s*\{\s*\}/,
`public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(RoozYarSaveFilePlugin.class);
        super.onCreate(savedInstanceState);
    }
}`);
  if (!main.includes('registerPlugin(RoozYarSaveFilePlugin.class)')) throw new Error('MainActivity patch failed');
  fs.writeFileSync(mainPath, main);
}

const manPath = path.join('android','app','src','main','AndroidManifest.xml');
let man = fs.readFileSync(manPath,'utf8');
// اضافه کردن مجوزهای جدید برای اعلان‌های دقیق و بیدار کردن گوشی
const perms = ['POST_NOTIFICATIONS', 'SCHEDULE_EXACT_ALARM', 'USE_EXACT_ALARM', 'RECEIVE_BOOT_COMPLETED', 'VIBRATE', 'WAKE_LOCK'];
for (const perm of perms) {
  if (!man.includes(`android.permission.${perm}"`)) {
    man = man.replace('</manifest>', `    <uses-permission android:name="android.permission.${perm}" />\n</manifest>`);
  }
}
fs.writeFileSync(manPath, man);
console.log('Android setup done (Alarms & Permissions updated)');
