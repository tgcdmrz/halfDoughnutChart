# Half Doughnut Chart for Power BI

Bu özel Power BI görselleştirmesi, verileri yarım halka şeklinde bir pasta grafiği olarak göstermenizi sağlar. Standart pasta grafiklerinden farklı olarak, bu görselleştirme yarım daire şeklinde tasarlanmıştır ve hem yüzde oranlarını hem de ölçüm değerlerini gösterebilir.

## Özellikler

- **Yarım Halka Tasarımı**: Verileri yarım daire şeklinde görselleştirme
- **Özelleştirilebilir Açılar**: Başlangıç ve bitiş açılarını ayarlayabilme (0-360 derece)
- **İç Yarıçap Ayarı**: İç boşluğun boyutunu yüzde olarak ayarlayabilme
- **Etiket Gösterimi**: Dilimler üzerinde etiketleri gösterme veya gizleme
- **Yüzde ve Ölçüm Değerleri**: Hem yüzde oranlarını hem de gerçek ölçüm değerlerini gösterebilme
- **Özelleştirilebilir Renkler**: Kategorilere özel renkler atayabilme
- **Etkileşimli Araç İpuçları**: Fare ile üzerine gelindiğinde detaylı bilgi gösterme
- **Seçim Desteği**: Dilimler üzerinde tıklama ile seçim yapabilme

## Kullanım

### Veri Gereksinimleri

Görselleştirme aşağıdaki veri alanlarını kullanır:

- **Kategori**: Dilimleri oluşturacak kategoriler (zorunlu)
- **Değerler**: Dilimlerin boyutunu belirleyen sayısal değerler (zorunlu)
- **Detaylar**: Dilimler için ek detaylar (isteğe bağlı)

### Biçimlendirme Seçenekleri

#### Grafik Seçenekleri
- **Başlangıç Açısı**: Grafiğin başlangıç açısı (0-360 derece)
- **Bitiş Açısı**: Grafiğin bitiş açısı (0-360 derece)
- **İç Yarıçap**: İç boşluğun boyutu (yüzde olarak)
- **Etiketleri Göster**: Etiketleri gösterme veya gizleme seçeneği

#### Etiket Ayarları
- **Yazı Tipi Boyutu**: Etiketlerin yazı tipi boyutu
- **Renk**: Etiketlerin rengi
- **Yüzdeyi Göster**: Yüzde değerlerini gösterme veya gizleme seçeneği

#### Kategori Renkleri
- **Dolgu Tipi**: Renk dolgu türü (varsayılan, özel, kategori başına)
- **Varsayılan Renk**: Tüm kategoriler için kullanılacak varsayılan renk

## Kurulum

1. `.pbiviz` dosyasını indirin
2. Power BI Desktop'ı açın
3. Görselleştirmeler panelinde "..." simgesine tıklayın
4. "Dosyadan içe aktar" seçeneğini seçin
5. İndirdiğiniz `.pbiviz` dosyasını seçin

## Geliştirme

Bu projeyi geliştirmek için:

1. Depoyu klonlayın:
   ```
   git clone https://github.com/tgcdmrz/halfDoughnutChart.git
   ```

2. Bağımlılıkları yükleyin:
   ```
   npm install
   ```

3. Geliştirme sunucusunu başlatın:
   ```
   pbiviz start
   ```

4. Görselleştirmeyi paketleyin:
   ```
   pbiviz package
   ```

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.
