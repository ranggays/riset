import Image from "next/image";
import Link from "next/link";
import styles from "./Home.module.css";

function Seal({ light = false }: { light?: boolean }) {
  return (
    <svg aria-hidden="true" className={styles.sealSvg} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="1.6" strokeDasharray="2 2" />
      <circle cx="16" cy="16" r="9.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="m12 16.5 2.6 2.6 5.4-5.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      {light && <title>Riset</title>}
    </svg>
  );
}

function Arrow() {
  return (
    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M3.5 8h9M8.5 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SplitLink({ href, children, variant = "primary" }: { href: string; children: React.ReactNode; variant?: "primary" | "secondary" | "light" }) {
  return (
    <Link className={`${styles.splitLink} ${styles[`splitLink_${variant}`]}`} href={href}>
      <span className={styles.splitLabel}>{children}</span>
      <span className={styles.splitArrow}><Arrow /></span>
    </Link>
  );
}

const workflow = [
  {
    eyebrow: "Pustaka riset",
    text: "Kumpulkan artikel dan konteksnya di satu ruang kerja.",
  },
  {
    eyebrow: "Peta konsep",
    text: "Lihat kaitan tujuan, metode, latar belakang, dan kesenjangan penelitian.",
  },
  {
    eyebrow: "Diskusi berbasis sumber",
    text: "Tanyakan isi artikel dengan konteks sumber yang tetap bisa ditelusuri.",
  },
];

const features = [
  {
    label: "Pustaka",
    title: "Mulai dari artikel yang sedang Anda baca",
    image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1000&q=85",
    alt: "Catatan dan buku terbuka di atas meja kerja",
    className: "featureLibrary",
  },
  {
    label: "Peta konsep",
    title: "Temukan benang merah antarpenelitian",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1000&q=85",
    alt: "Visual bumi dan jaringan koneksi digital",
    className: "featureMap",
  },
  {
    label: "Catatan",
    title: "Simpan kutipan yang ingin Anda bawa kembali",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1000&q=85",
    alt: "Kelompok berdiskusi bersama di meja kerja",
    className: "featureNotes",
  },
];

export default function HomePage() {
  return (
    <div className={styles.homePage}>
      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <nav className={styles.navigation} aria-label="Navigasi utama">
            <Link aria-label="Riset, beranda" className={styles.brandSeal} href="/">
              <Seal />
            </Link>
            <div className={styles.navigationPill}>
              <Link className={styles.brandName} href="/">Riset</Link>
              <span className={styles.navDivider} aria-hidden="true" />
              <div className={styles.navLinks}>
                <a href="#cara-kerja">Cara kerja</a>
                <a href="#fitur">Fitur</a>
                <a href="#peta-riset">Peta riset</a>
                <a href="#tentang">Tentang</a>
              </div>
            </div>
            <Link className={styles.navAction} href="/projects">Buka ruang kerja <Arrow /></Link>
          </nav>

          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <p className={styles.heroKicker}>Ruang kerja penelitian</p>
              <h1 className={styles.displayTitle}>Pahami riset sebagai satu keseluruhan.</h1>
              <p className={styles.heroDescription}>
                Kumpulkan artikel, petakan kaitan antarpenelitian, lalu diskusikan temuan dengan konteks yang jelas.
              </p>
              <div className={styles.heroActions}>
                <SplitLink href="/projects">Buka Dashboards</SplitLink>
                <SplitLink href="#cara-kerja" variant="secondary">Lihat cara kerja</SplitLink>
              </div>
            </div>

            <div className={styles.heroCollage} aria-label="Cara Riset membantu membaca literatur">
              <Link className={`${styles.editorialCard} ${styles.heroPhoto}`} href="/projects">
                <Image
                  alt="Peneliti menulis dan menyusun catatan di meja kerja"
                  className={styles.coverImage}
                  fill
                  priority
                  sizes="(max-width: 760px) 100vw, 42vw"
                  src="https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1000&q=85"
                />
                <span className={styles.cardScrim} />
                <span className={styles.cardBadge}>Pustaka riset</span>
                <span className={styles.cardCaption}>Simpan bacaan penting dalam satu tempat.</span>
                <span className={styles.cardArrow}><Arrow /></span>
              </Link>
              <div className={styles.heroStack}>
                <Link className={`${styles.editorialCard} ${styles.heroPhotoSmall}`} href="#peta-riset">
                  <Image
                    alt="Jaringan informasi yang saling terhubung"
                    className={styles.coverImage}
                    fill
                    sizes="(max-width: 760px) 100vw, 32vw"
                    src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=900&q=85"
                  />
                  <span className={styles.cardScrim} />
                  <span className={styles.cardBadge}>Peta konsep</span>
                  <span className={styles.cardCaption}>Lihat hubungan di balik tiap temuan.</span>
                  <span className={styles.cardArrow}><Arrow /></span>
                </Link>
                <Link className={`${styles.editorialCard} ${styles.heroStatement}`} href="#fitur">
                  <span className={styles.cardBadge}>Diskusi berbasis sumber</span>
                  <span className={styles.statementCaption}>Baca lebih dalam. Hubungkan lebih banyak.</span>
                  <span className={styles.cardArrow}><Arrow /></span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section className={styles.statementSection} id="tentang">
          <div className={styles.statementInner}>
            <span className={styles.statementSeal}><Seal /></span>
            <h2>Satu artikel memberi jawaban. Hubungannya membantu Anda melihat pertanyaan berikutnya.</h2>
            <p>Riset menyatukan bacaan dan gagasan agar proses memahami literatur terasa lebih terarah.</p>
            <SplitLink href="/projects">Mulai dari ruang kerja</SplitLink>
          </div>
        </section>

        <section className={styles.workflowSection} id="cara-kerja">
          <div className={styles.workflowInner}>
            <div className={styles.workflowGrid}>
              {workflow.map((item) => (
                <article className={styles.workflowCard} key={item.eyebrow}>
                  <span>{item.eyebrow}</span>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
            <div className={styles.centerAction}><SplitLink href="/projects">Jelajahi ruang kerja</SplitLink></div>
          </div>
        </section>

        <section className={styles.relationSection} id="peta-riset">
          <div className={styles.relationPanel}>
            <div className={styles.relationIntro}>
              <span>Hubungkan temuan</span>
              <h2>Literatur punya lebih dari satu arah.</h2>
            </div>
            <div className={styles.relationTrack} aria-label="Jenis hubungan antarartikel">
              <span>Latar belakang</span>
              <span>Metodologi</span>
              <span>Tujuan</span>
              <span>Kesenjangan</span>
              <span>Arah penelitian</span>
            </div>
            <p className={styles.relationNote}>Petakan hubungan yang membantu Anda membaca kumpulan artikel dengan sudut pandang yang lebih utuh.</p>
          </div>
        </section>

        <section className={styles.featureSection} id="fitur">
          <div className={styles.featureInner}>
            <div className={styles.featureIntro}>
              <span>Ruang kerja riset</span>
              <h2>Dari daftar bacaan menuju pemahaman yang terhubung.</h2>
              <p>Setiap bagian membantu Anda menyimpan, meninjau, dan membahas literatur dengan konteksnya.</p>
            </div>
            <div className={styles.featureGrid}>
              {features.map((feature) => (
                <Link className={`${styles.editorialCard} ${styles[feature.className]}`} href="/projects" key={feature.label}>
                  <Image alt={feature.alt} className={styles.coverImage} fill sizes="(max-width: 760px) 100vw, 33vw" src={feature.image} />
                  <span className={styles.cardScrim} />
                  <span className={styles.cardBadge}>{feature.label}</span>
                  <span className={styles.featureCaption}>{feature.title}</span>
                  <span className={styles.cardArrow}><Arrow /></span>
                </Link>
              ))}
            </div>
            <div className={styles.featureAction}><SplitLink href="/projects" variant="light">Lihat semua Dashboards</SplitLink></div>
          </div>
        </section>

        <section className={styles.contactSection}>
          <div className={styles.contactInner}>
            <div className={styles.contactImage}>
              <Image
                alt="Rekan peneliti bertukar gagasan di ruang kerja"
                className={styles.coverImage}
                fill
                sizes="(max-width: 760px) 100vw, 38vw"
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=85"
              />
            </div>
            <div className={styles.contactCopy}>
              <span>Untuk proses riset Anda</span>
              <h2>Gagasan yang kuat tumbuh dari bacaan yang saling berbicara.</h2>
              <p>Mulai dari artikel yang sedang Anda baca, lalu susun hubungan dan catatan yang membantu langkah berikutnya.</p>
              <SplitLink href="/projects" variant="secondary">Buka ruang kerja</SplitLink>
            </div>
          </div>
        </section>

        <section className={styles.finalCta}>
          <div>
            <h2>Mulai dari satu pertanyaan riset.</h2>
            <p>Tambahkan artikel dan lihat ke mana hubungan antaride membawa Anda.</p>
          </div>
          <SplitLink href="/projects">Masuk ke Dashboards</SplitLink>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerMain}>
          <div className={styles.footerBrand}>
            <Link aria-label="Riset, kembali ke beranda" className={styles.footerSeal} href="/">
              <Seal light />
            </Link>
            <div>
              <strong>Riset</strong>
              <p>Ruang kerja untuk membaca, menghubungkan, dan mendiskusikan penelitian.</p>
            </div>
          </div>
          <nav className={styles.footerNav} aria-label="Navigasi footer">
            <a href="#cara-kerja">Cara kerja</a>
            <a href="#fitur">Fitur</a>
            <a href="#peta-riset">Peta riset</a>
            <Link href="/projects">Dashboards</Link>
          </nav>
        </div>
        <div className={styles.footerBottom}>
          <span>Riset</span>
          <span>Ruang kerja penelitian</span>
          <Link href="/projects">Buka ruang kerja <Arrow /></Link>
        </div>
      </footer>
    </div>
  );
}
