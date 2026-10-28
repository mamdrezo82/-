import fs from 'node:fs';
import path from 'node:path';

const pkgDir = path.join('android','app','src','main','java','com','roozyar','personal');
fs.mkdirSync(pkgDir, { recursive: true });

// ۱. کپی کردن پلاگین ذخیره فایل (قبلی)
fs.copyFileSync(path.join('native','RoozYarSaveFilePlugin.java'), path.join(pkgDir,'RoozYarSaveFilePlugin.java'));

// ۲. ساخت پلاگین اختصاصی آلارم (زنگ ممتد)
const alarmPluginCode = `
package com.roozyar.personal;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "RoozYarAlarm")
public class RoozYarAlarmPlugin extends Plugin {
    private Ringtone ringtone;

    @PluginMethod
    public void playAlarm(PluginCall call) {
        try {
            Uri alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
            if (alarmUri == null) {
                alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            }
            ringtone = RingtoneManager.getRingtone(getContext(), alarmUri);
            ringtone.setLooping(true); // زنگ ممتد
            ringtone.play();
            call.resolve();
        } catch (Exception e) {
            call.reject("Could not play alarm: " + e.getMessage());
        }
    }

    @PluginMethod
    public void stopAlarm(PluginCall call) {
        try {
            if (ringtone != null && ringtone.isPlaying()) {
                ringtone.stop();
            }
            call.resolve();
        } catch (Exception e) {
            call.reject("Error stopping alarm: " + e.getMessage());
        }
    }
}
`;
fs.writeFileSync(path.join(pkgDir,'RoozYarAlarmPlugin.java'), alarmPluginCode);

// ۳. تزریق پلاگین‌ها در MainActivity
const mainPath = path.join(pkgDir,'MainActivity.java');
let main = fs.readFileSync(mainPath,'utf8');
if (!main.includes('registerPlugin(RoozYarSaveFilePlugin.class)')) {
  if (!main.includes('import android.os.Bundle;')) main = main.replace(/(package [^;]+;\s*)/, '$1\nimport android.os.Bundle;\n');
  main = main.replace(/public class MainActivity extends BridgeActivity\s*\{\s*\}/,
`public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(RoozYarSaveFilePlugin.class);
        registerPlugin(RoozYarAlarmPlugin.class);
        super.onCreate(savedInstanceState);
    }
}`);
  fs.writeFileSync(mainPath, main);
}

// ۴. اضافه کردن مجوزهای لازم
const manPath = path.join('android','app','src','main','AndroidManifest.xml');
let man = fs.readFileSync(manPath,'utf8');
const perms = ['POST_NOTIFICATIONS', 'SCHEDULE_EXACT_ALARM', 'USE_EXACT_ALARM', 'RECEIVE_BOOT_COMPLETED', 'VIBRATE', 'WAKE_LOCK', 'FOREGROUND_SERVICE'];
for (const perm of perms) {
  if (!man.includes(`android.permission.${perm}"`)) {
    man = man.replace('</manifest>', `    <uses-permission android:name="android.permission.${perm}" />\n</manifest>`);
  }
}
fs.writeFileSync(manPath, man);
console.log('Android setup done (Alarms & Permissions updated)');
