# EduSync Audit Raporu — 2026-05-19 11:38:38

**Schedule:** `mock_schedule.json`  
**Dönem:** Güz (kaynak: data_path=guz)

---

## Özet

| Paket | ✅ PASS | ⚠ WARN | ❌ FAIL | ℹ INFO |
|---|---|---|---|---|
| Hocalar | 57 | 18 | 0 | 0 |
| Sabit Saat Kısıtları | 28 | 0 | 1 | 0 |
| Müfredat | 58 | 0 | 2 | 9 |
| Özel Derslikler | 31 | 0 | 0 | 0 |
| **TOPLAM** | **174** | **18** | **3** | **9** |

---

## 👤 Hocalar

### Blok İhlalleri (Hard Kısıt) [✅15]
*'Slot Blokla' ile kapatılan yarı-günlere atama var mı?*

<details>
<summary>✅ Geçti (15 öğe)</summary>

- ✅ **AY** — bloklu günlere atama yok
- ✅ **ED** — bloklu günlere atama yok
- ✅ **ENY** — bloklu günlere atama yok
- ✅ **ESG** — bloklu günlere atama yok
- ✅ **EÇ** — bloklu günlere atama yok
- ✅ **KÖ** — bloklu günlere atama yok
- ✅ **MÖ** — bloklu günlere atama yok
- ✅ **NA** — bloklu günlere atama yok
- ✅ **SO** — bloklu günlere atama yok
- ✅ **SÖA** — bloklu günlere atama yok
- ✅ **UG** — bloklu günlere atama yok
- ✅ **YA** — bloklu günlere atama yok
- ✅ **ZC** — bloklu günlere atama yok
- ✅ **İD** — bloklu günlere atama yok
- ✅ **ŞI** — bloklu günlere atama yok

</details>

### Tercih Uyumu + Nötr Atamalar [⚠16 · ✅14]
*Tercih edilen slotlara atama var mı? Nötr slotlara atama ⚠.*

<details>
<summary>⚠ 16 uyarı — detay</summary>

- ⚠ **ED** — tercih var ama tercih slotuna atama yok
- ⚠ **ED** — nötr slota atama: `152115037-A` (Perşembe 9:00)
- ⚠ **ENY** — nötr slota atama: `152118634-A` (Perşembe 10:00)
- ⚠ **ENY** — nötr slota atama: `152113022-A` (Cuma 10:00)
- ⚠ **ESG** — nötr slota atama: `503002506-A` (Perşembe 15:00)
- ⚠ **EÇ** — nötr slota atama: `503001508-A` (Salı 9:00)
- ⚠ **MÖ** — nötr slota atama: `152115024-B` (Pazartesi 13:00)
- ⚠ **MÖ** — nötr slota atama: `152115024-A` (Pazartesi 9:00)
- ⚠ **SÖA** — nötr slota atama: `152113018-A` (Perşembe 14:00)
- ⚠ **SÖA** — nötr slota atama: `503002513-A` (Çarşamba 9:00)
- ⚠ **SÖA** — nötr slota atama: `152113025-A` (Salı 9:00)
- ⚠ **SÖA** — nötr slota atama: `152113018-B` (Perşembe 16:00)
- ⚠ **YA** — nötr slota atama: `503001516-A` (Salı 13:00)
- ⚠ **ZC** — nötr slota atama: `152113020-B` (Salı 13:00)
- ⚠ **ŞI** — nötr slota atama: `152113023-A` (Çarşamba 10:00)
- ⚠ **ŞI** — nötr slota atama: `503011699-A` (Perşembe 9:00)
- ✅ **AY** — tercih bildirimi yok, atama kabul
- ✅ **ENY** — 2 tercih slotunda atama var
- ✅ **ESG** — 1 tercih slotunda atama var
- ✅ **EÇ** — 2 tercih slotunda atama var
- ✅ **KÖ** — 2 tercih slotunda atama var
- ✅ **MÖ** — 2 tercih slotunda atama var
- ✅ **NA** — 2 tercih slotunda atama var
- ✅ **SO** — 2 tercih slotunda atama var
- ✅ **SÖA** — 1 tercih slotunda atama var
- ✅ **UG** — 2 tercih slotunda atama var
- ✅ **YA** — 3 tercih slotunda atama var
- ✅ **ZC** — 1 tercih slotunda atama var
- ✅ **İD** — tercih bildirimi yok, atama kabul
- ✅ **ŞI** — 2 tercih slotunda atama var

</details>

### Akşam Tercihi [✅11]
*Akşam ders istemeyenlere 17:00+ atama var mı?*

<details>
<summary>✅ Geçti (11 öğe)</summary>

- ✅ **AY** — akşam tercihi uyumlu (yok)
- ✅ **ED** — akşam tercihi uyumlu (yok)
- ✅ **ENY** — akşam tercihi uyumlu (yok)
- ✅ **EÇ** — akşam tercihi uyumlu (yok)
- ✅ **MÖ** — akşam tercihi uyumlu (yok)
- ✅ **NA** — akşam tercihi uyumlu (yok)
- ✅ **SO** — akşam tercihi uyumlu (yok)
- ✅ **SÖA** — akşam tercihi uyumlu (yok)
- ✅ **UG** — akşam tercihi uyumlu (yok)
- ✅ **YA** — akşam tercihi uyumlu (yok)
- ✅ **ZC** — akşam tercihi uyumlu (yok)

</details>

### Gün Sayısı Hedefi [⚠2 · ✅13]
*Hedef gün sayısına uyum (WP-79 formülü; pure-lab hariç, WP-92).*

<details>
<summary>⚠ 2 uyarı — detay</summary>

- ⚠ **KÖ** — 1/2 gün (fark ±1) (Pazartesi)
- ⚠ **UG** — 2/1 gün (fark ±1) (Salı, Çarşamba)
- ✅ **AY** — 2/2 gün (Pazartesi, Perşembe)
- ✅ **ED** — 1/1 gün (Perşembe)
- ✅ **ENY** — 1/1 gün (Perşembe)
- ✅ **ESG** — 2/2 gün (Perşembe, Salı)
- ✅ **EÇ** — 1/1 gün (Salı)
- ✅ **MÖ** — 1/1 gün (Pazartesi)
- ✅ **NA** — 2/2 gün (Pazartesi, Çarşamba)
- ✅ **SO** — 2/2 gün (Cuma, Çarşamba)
- ✅ **SÖA** — 2/2 gün (Salı, Çarşamba)
- ✅ **YA** — 3/3 gün (Perşembe, Salı, Çarşamba)
- ✅ **ZC** — 2/2 gün (Salı, Çarşamba)
- ✅ **İD** — 1/1 gün (Perşembe)
- ✅ **ŞI** — 2/2 gün (Perşembe, Çarşamba)

</details>

### Co-Teaching Senkronizasyonu [✅4]
*Aynı dersin co-teaching şubeleri aynı güne atandı mı?*

<details>
<summary>✅ Geçti (4 öğe)</summary>

- ✅ `152113020` — şubeler aynı gün: Salı | ESG(152113020-A), ZC(152113020-B)
- ✅ `152115016` — şubeler aynı gün: Pazartesi | AY(152115016-A), SBK(152115016-B)
- ✅ `152115026` — şubeler aynı gün: Çarşamba | UG(152115026-A), NA(152115026-B)
- ✅ `152115037` — şubeler aynı gün: Perşembe | ED(152115037-A), YA(152115037-B)

</details>

---

## 🕐 Sabit Saat Kısıtları

### Sabit Gün ve Saat [✅26]
*Excel'de 'Sabit Gün ve Saat' kolonu doldurulan dersler doğru slota atandı mı?*

<details>
<summary>✅ Geçti (26 öğe)</summary>

- ✅ `152111017-A-P1` → Salı 13:00 ✅
- ✅ `152111017-A-P2` → Çarşamba 11:00 ✅
- ✅ `152111017-B-P1` → Salı 15:00 ✅
- ✅ `152111017-B-P2` → Çarşamba 13:00 ✅
- ✅ `152111022-A` → Pazartesi 9:00 ✅
- ✅ `152111022-B` → Pazartesi 13:00 ✅
- ✅ `152111006-A` → Çarşamba 15:00 ✅
- ✅ `152111006-B` → Perşembe 15:00 ✅
- ✅ `152111005-A` → Perşembe 9:00 ✅
- ✅ `152111005-B` → Perşembe 12:00 ✅
- ✅ `151011215-E` → Pazartesi 17:00 ✅
- ✅ `151011213-A` → Çarşamba 19:00 ✅
- ✅ `151011208-F` → Salı 17:00 ✅
- ✅ `*-A` → Cuma 15:00 ✅
- ✅ `152113026-A` → Çarşamba 13:00 ✅
- ✅ `*-*` → Cuma 9:00 ✅
- ✅ `152117114-A` → Pazartesi 13:00 ✅
- ✅ `152116013-A` → Pazartesi 16:00 ✅
- ✅ `152116029-A` → Perşembe 9:00 ✅
- ✅ `152117135-A` → Pazartesi 9:00 ✅
- ✅ `152117107-A` → Çarşamba 13:00 ✅
- ✅ `152117127-A` → Salı 9:00 ✅
- ✅ `152117117-A` → Cuma 14:00 ✅
- ✅ `503001504-A` → Pazartesi 13:00 ✅
- ✅ `503001513-A` → Çarşamba 15:00 ✅
- ✅ `501011101-C` → Salı 17:00 ✅

</details>

### Global Hard Kısıt İhlalleri [❌1 · ✅2]
*Dekanlık kararı, Cuma Namazı vb. global hard kısıtlara uyum.*

- ❌ **Dekanlık Kararı (Lisans)** — 1 ihlal: `152116013-A`

<details>
<summary>✅ Geçti (2 öğe)</summary>

- ✅ **Cuma Namazı Arası** (Cuma 12:00-14:00) — ihlal yok
- ✅ **Bölüm Toplantısı** (Cuma 9:00-12:00) — ihlal yok

</details>

---

## 📚 Müfredat

### 2021sablon — Zorunlu Dersler (Güz) [✅1]
*Her zorunlu ders schedule'da atandı mı?*

<details>
<summary>✅ 1 öğe — detay</summary>

- ℹ `152111013` ADVANCED READING AND WRITING [A] (Y1) — atlandı (ignoreOpt, bağlı ders yok)
- ℹ `152111019` INTRODUCTION TO PROGRAMMING [A] (Y1) — atlandı (ignoreOpt, bağlı ders yok)
- ℹ `152111019` INTRODUCTION TO PROGRAMMING [B] (Y1) — atlandı (ignoreOpt, bağlı ders yok)
- ℹ `152113017` NESNE TABANLI PROGRAMLAMA I [A] (Y3) — atlandı (ignoreOpt, bağlı ders yok)
- ℹ `152113017` NESNE TABANLI PROGRAMLAMA I [B] (Y3) — atlandı (ignoreOpt, bağlı ders yok)
- ℹ `152113024` İŞ SAĞLIĞI VE GÜVENLİĞİ I [A] (Y3) — atlandı (ignoreOpt, bağlı ders yok)
- ℹ `152113024` İŞ SAĞLIĞI VE GÜVENLİĞİ I [B] (Y3) — atlandı (ignoreOpt, bağlı ders yok)
- ✅ `152117114` ECONOMICS [A] (Y7) — atandı

</details>

### 2021sablon — Seçmeli Torbaları (Güz) [❌1 · ✅3]
*Her torbadan beklenen ders sayısı açıldı mı?*

- ℹ **ADS** (ALAN DIŞI SEÇMELİ): 1 ders açıldı — beklenti tanımlanmamış
- ℹ **SS** (SOSYAL SEÇMELİ): 1 ders açıldı — beklenti tanımlanmamış
- ❌ **TSA** (TEKNİK SEÇMELİ A): 1 / 2 (1 eksik)

<details>
<summary>✅ Geçti (3 öğe)</summary>

- ✅ **TOS** (TEKNİK OLMAYAN SEÇMELİ): 2 / 2 beklenen
- ✅ **TSB** (TEKNİK SEÇMELİ B): 4 / 1 beklenen
- ✅ **TSC** (TEKNİK SEÇMELİ C): 3 / 1 beklenen

</details>

### 2024sablon — Zorunlu Dersler (Güz) [❌1 · ✅50]
*Her zorunlu ders schedule'da atandı mı?*

- ❌ `152113026` İŞ SAĞLIĞI VE GÜVENLİĞİ I [B] (Y3) — `152113024` dersine bağlı ama o ders de atanmamış

<details>
<summary>✅ Geçti (50 öğe)</summary>

- ✅ `*` REKTÖRLÜK ALAN DIŞI SEÇMELİ [*] (YNone) — atandı
- ✅ `*` SOSYAL SEÇMELİ I [A] (YNone) — atandı
- ✅ `151011208` ATATÜRK İLKE.VE İNK.TARİHİ I [F] (Y1) — atandı
- ✅ `151011213` TÜRK DİLİ ÖZEL I [A] (Y1) — atandı
- ✅ `151011215` TÜRK DİLİ I [E] (Y1) — atandı
- ✅ `152111005` PHYSICS I [A] (Y1) — atandı
- ✅ `152111005` PHYSICS I [B] (Y1) — atandı
- ✅ `152111006` PHYSICS I LAB [A] (Y1) — atandı
- ✅ `152111006` PHYSICS I LAB [B] (Y1) — atandı
- ✅ `152111011` INTRODUCTION TO PROGRAMMING LAB. [A] (Y1) — atandı
- ✅ `152111011` INTRODUCTION TO PROGRAMMING LAB. [B] (Y1) — atandı
- ✅ `152111012` INTRODUCTION TO COMPUTER ENGINEERING [A] (Y1) — atandı
- ✅ `152111012` INTRODUCTION TO COMPUTER ENGINEERING [B] (Y1) — atandı
- ✅ `152111017` CALCULUS I [A-P1] (Y1) — atandı
- ✅ `152111017` CALCULUS I [A-P2] (Y1) — atandı
- ✅ `152111017` CALCULUS I [B-P1] (Y1) — atandı
- ✅ `152111017` CALCULUS I [B-P2] (Y1) — atandı
- ✅ `152111021` MÜHENDİSLİK GRAFİĞİ [A] (Y1) — atandı
- ✅ `152111021` MÜHENDİSLİK GRAFİĞİ [B] (Y1) — atandı
- ✅ `152111022` INTRODUCTION TO PROGRAMMING [A] (Y1) — atandı
- ✅ `152111022` INTRODUCTION TO PROGRAMMING [B] (Y1) — atandı
- ✅ `152111023` ADVANCED READING AND WRITING [A] (Y1) — atandı
- ✅ `152111023` ADVANCED READING AND WRITING [B] (Y1) — atandı
- ✅ `152113018` NESNE TABANLI PROGRAMLAMA I LAB. [A] (Y3) — atandı
- ✅ `152113018` NESNE TABANLI PROGRAMLAMA I LAB. [B] (Y3) — atandı
- ✅ `152113019` DIFFERENTIAL EQUATIONS [A] (Y3) — atandı
- ✅ `152113019` DIFFERENTIAL EQUATIONS [B] (Y3) — atandı
- ✅ `152113020` SAYISAL TASARIM [A] (Y3) — atandı
- ✅ `152113020` SAYISAL TASARIM [B] (Y3) — atandı
- ✅ `152113021` VERİ YAPILARI [A] (Y3) — atandı
- ✅ `152113021` VERİ YAPILARI [B] (Y3) — atandı
- ✅ `152113022` VERİ YAPILARI LABORATUVARI [A] (Y3) — atandı
- ✅ `152113022` VERİ YAPILARI LABORATUVARI [B] (Y3) — atandı
- ✅ `152113023` NUMERICAL METHODS [A] (Y3) — atandı
- ✅ `152113023` NUMERICAL METHODS [B] (Y3) — atandı
- ✅ `152113025` NESNE TABANLI PROGRAMLAMA I [A] (Y3) — atandı
- ✅ `152113025` NESNE TABANLI PROGRAMLAMA I [B] (Y3) — atandı
- ✅ `152113026` İŞ SAĞLIĞI VE GÜVENLİĞİ I [A] (Y3) — atandı
- ✅ `152115016` VERİ TABANI YÖNETİM SİSTEMLERİ [A] (Y5) — atandı
- ✅ `152115016` VERİ TABANI YÖNETİM SİSTEMLERİ [B] (Y5) — atandı
- ✅ `152115018` VERİ TABANI YÖNETİM SİSTEMLERİ LAB. [A] (Y5) — atandı
- ✅ `152115018` VERİ TABANI YÖNETİM SİSTEMLERİ LAB. [B] (Y5) — atandı
- ✅ `152115024` INTRODUCTION TO MICROCOMPUTERS [A] (Y5) — atandı
- ✅ `152115024` INTRODUCTION TO MICROCOMPUTERS [B] (Y5) — atandı
- ✅ `152115025` INTRODUCTION TO MICROCOMPUTERS LAB. [A] (Y5) — atandı
- ✅ `152115025` INTRODUCTION TO MICROCOMPUTERS LAB. [B] (Y5) — atandı
- ✅ `152115026` YAZILIM MÜHENDİSLİĞİ [A] (Y5) — atandı
- ✅ `152115026` YAZILIM MÜHENDİSLİĞİ [B] (Y5) — atandı
- ✅ `152115037` TASARIM SÜREÇLERİ [A] (Y5) — atandı
- ✅ `152115037` TASARIM SÜREÇLERİ [B] (Y5) — atandı

</details>

### 2024sablon — Seçmeli Torbaları (Güz) [✅4]
*Her torbadan beklenen ders sayısı açıldı mı?*

<details>
<summary>✅ Geçti (4 öğe)</summary>

- ✅ **ADS** (ALAN DIŞI SEÇMELİ): 1 / 1 beklenen
- ✅ **SS** (SOSYAL SEÇMELİ): 1 / 1 beklenen
- ✅ **TSA** (TEKNİK SEÇMELİ A): 5 / 3 beklenen
- ✅ **TSB** (TEKNİK SEÇMELİ B): 3 / 1 beklenen

</details>

---

## 🏫 Özel Derslikler

### Özel Derslik Ataması [✅31]
*Excel'de 'Özel Derslik' kolonu doldurulan dersler doğru odaya atandı mı?*

<details>
<summary>✅ Geçti (31 öğe)</summary>

- ✅ `152111011-A` → `LAB-361` ✅
- ✅ `152111011-B` → `LAB-361` ✅
- ✅ `152111021-A` → `LAB-361` ✅
- ✅ `152111021-B` → `LAB-361` ✅
- ✅ `152111022-A` → `LAB-361` ✅
- ✅ `152111022-B` → `LAB-361` ✅
- ✅ `152113018-A` → `LAB-361` ✅
- ✅ `152113018-B` → `LAB-361` ✅
- ✅ `152113022-A` → `LAB-361` ✅
- ✅ `152113022-B` → `LAB-361` ✅
- ✅ `152115018-A` → `LAB-361` ✅
- ✅ `152115018-B` → `LAB-361` ✅
- ✅ `152115025-A` → `LAB-361` ✅
- ✅ `152115025-B` → `LAB-361` ✅
- ✅ `152117107-A` → `LAB-364` ✅
- ✅ `152117111-A` → `LAB-364` ✅
- ✅ `152117121-A` → `LAB-364` ✅
- ✅ `152117127-A` → `LAB-364` ✅
- ✅ `503001501-A` → `384` ✅
- ✅ `503001503-A` → `384` ✅
- ✅ `503001504-A` → `384` ✅
- ✅ `503001507-A` → `384` ✅
- ✅ `503001508-A` → `384` ✅
- ✅ `503001512-A` → `384` ✅
- ✅ `503001513-A` → `384` ✅
- ✅ `503001516-A` → `384` ✅
- ✅ `503002506-A` → `384` ✅
- ✅ `503002513-A` → `384` ✅
- ✅ `503011601-A` → `383` ✅
- ✅ `503011604-A` → `383` ✅
- ✅ `503011699-A` → `383` ✅

</details>

---
