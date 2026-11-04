// WP-06 / WP-24: the single dictionary of the page (Turkish for v0.1; English follows in v0.2).
//
// Every visible string lives here and nowhere else; the page writes them with textContent only.
// This is the one script that contains non-ASCII text (a test allows exactly the Turkish letters).
// Strings use {name} placeholders. t() throws on an unknown key: a missing string must fail loudly
// in tests, never show up as a blank or an English fallback in front of a student.
//
// Loaded as a classic <script> (browser: window.SGB.i18n) and via require() (node:test).
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module !== null && module.exports) {
    module.exports = api;
  } else {
    root.SGB = root.SGB || {};
    root.SGB.i18n = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var TR = {
    page: {
      title: "Sınav Yeri Bilgisi"
    },
    exam: {
      AS1: "1. Ara Sınav",
      AS2: "2. Ara Sınav",
      FNLS: "Yarıyıl Sonu Sınavı",
      BUTS: "Bütünleme Sınavı"
    },
    label: {
      course: "Ders",
      date: "Tarih",
      time: "Saat",
      room: "Derslik",
      desk: "Masa",
      side: "Koltuk",
      row: "Sıra",
      column: "Sütun",
      unknownSeat: "OGUBS'deki yer bilgisi"
    },
    value: {
      studentNo: "No {no}",
      section: "Şube {section}",
      overflow: "Ek oturma {n}",
      overflowNote: "Masa numarası verilmemiş; ek oturma yeri.",
      venueNote: "Bu mekânın masa krokisi yok."
    },
    side: {
      a: "Sol (a)",
      b: "Sağ (b)"
    },
    plan: {
      title: "Derslik krokisi",
      board: "Tahta",
      sideNote: "a = sol, b = sağ (tahtaya bakan öğrenciye göre)",
      mismatch: "Masa numarası sıra ve sütunla uyuşmuyor: işaret yaklaşık bir konumu gösterir.",
      partial: "Dersliğin yalnız bir bölümü çizildi; üç nokta, dersliğin o yönde devam ettiğini gösterir.",
      deskOnlyDots: "Dersliğin düzeni bilinmiyor; yalnız masanız çizildi. Üç nokta, arada çizilmeyen sıra ya da sütunları gösterir.",
      deskOnlyS1: "Yalnız masanız çizildi.",
      deskOnlyS1Dots: "Yalnız masanız çizildi; üç nokta, arada çizilmeyen sıra ya da sütunları gösterir.",
      ariaRoom: "Derslik {room} krokisi.",
      ariaSeat: "Derslik {room} krokisi. Yeriniz: masa {desk}, sıra {row}, sütun {column}.",
      ariaSeatSide: "Derslik {room} krokisi. Yeriniz: masa {desk}, {side}, sıra {row}, sütun {column}.",
      ariaPartial: "Dersliğin yalnız bir bölümü çizili."
    },
    footer: {
      text: "Bu sayfa bir prototiptir. Sınava nerede gireceğinizi kolayca görmeniz için hazırlanmıştır; sınava giriş için gerekli değildir. Doğru bilgi için OGUBS'deki kayıtlar ve sınav salonundaki gözetmen listeleri esastır.",
      version: "Sürüm {version}"
    },
    band: {
      trailer: "Kesin bilgi için sınav salonundaki gözetmen listesine bakın.",
      F1: { title: "Bağlantı okunamadı", text: "Adres eksik ya da bozuk. OGUBS'deki bağlantıdan sayfayı yeniden açın." },
      S1: { title: "Masa numarası sıra ve sütunla uyuşmuyor", text: "OGUBS'den gelen masa numarası, sıra ve sütundan hesaplanan numarayla aynı değil. Kroki yalnız bu masayı gösterir; işaret yaklaşık bir konumdur. Sınav yerinizi OGUBS kayıtlarından kontrol edin." },
      I1: { title: "Bu sınav için oturma bilgisi yok", text: "OGUBS bu sınav için bir yer göndermedi." },
      I2: { title: "Sınav tarihi geçti", text: "Bu sayfadaki sınavın tarihi geçmiş." },
      I3: { title: "Yer bilgisi tanınmadı", text: "OGUBS'den gelen yer bilgisi bu sayfanın tanıdığı biçimlerin hiçbirine uymuyor. Bağlantı eksik ya da hatalı açılmış olabilir (ör. yanlış tıklama ya da kopyalama), ya da sayfa bu biçimi henüz tanımıyor olabilir. Sınav yerinizi OGUBS kayıtlarından kontrol edin." },
      I4: { title: "Derslik düzeni bilinmiyor", text: "Bu derslik için sıra ve sütun bilgisi yok; derslik ve masa bilgisi OGUBS'den geldiği gibi gösteriliyor. Kesin bilgi için OGUBS kayıtlarına bakın." }
    },
    unexpected: {
      title: "Sayfa gösterilemedi",
      text: "Beklenmeyen bir hata oluştu. Sayfayı yenileyin; sorun sürerse sınav yerinizi OGUBS kayıtlarından kontrol edin."
    },
    frame: "Bu sayfa başka bir sayfanın içinde gösterilemez. Adresi doğrudan tarayıcıda açın.",
    noscript: "Bu sayfa JavaScript gerektirir. JavaScript'i açıp sayfayı yenileyin.",
    months: ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"],
    weekdays: ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"]
  };

  var DICTIONARIES = { tr: TR };

  function lookup(dict, path) {
    var node = dict;
    var parts = path.split('.');
    for (var i = 0; i < parts.length; i++) {
      if (node === null || typeof node !== 'object' || !Object.prototype.hasOwnProperty.call(node, parts[i])) {
        throw new Error('unknown string key: ' + path);
      }
      node = node[parts[i]];
    }
    return node;
  }

  /** Fill {name} placeholders. A placeholder without a value is an error, not a blank. */
  function fmt(template, values) {
    return template.replace(/\{([A-Za-z0-9]+)\}/g, function (whole, name) {
      if (!values || !Object.prototype.hasOwnProperty.call(values, name)) {
        throw new Error('missing value for {' + name + '} in: ' + template);
      }
      return String(values[name]);
    });
  }

  /**
   * A translator for one language: t(path, values) returns a string, list(path) returns an array of strings.
   *
   * @param {string} [language]  'tr' (default)
   */
  function create(language) {
    var name = language || 'tr';
    if (!Object.prototype.hasOwnProperty.call(DICTIONARIES, name)) throw new Error('unknown language: ' + name);
    var dict = DICTIONARIES[name];
    return {
      language: name,
      t: function (path, values) {
        var v = lookup(dict, path);
        if (typeof v !== 'string') throw new Error('not a string: ' + path);
        return fmt(v, values);
      },
      list: function (path) {
        var v = lookup(dict, path);
        if (!Array.isArray(v)) throw new Error('not a list: ' + path);
        return v.slice();
      },
      has: function (path) {
        try { lookup(dict, path); return true; } catch (e) { return false; }
      }
    };
  }

  return { create: create, fmt: fmt, DICTIONARIES: DICTIONARIES };
});
