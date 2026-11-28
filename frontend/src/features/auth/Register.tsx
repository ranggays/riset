"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerAction } from "./actions/actions";
import styles from "./components/AuthForm.module.css";

export default function Register() {
  const [form, setForm] = useState({
    fullName: "",
    sid: "",
    email: "",
    group: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const updateForm = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSidChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.currentTarget.value;
    if (value === "" || /^\d+$/.test(value)) updateForm("sid", value);
  };

  const handleSignUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");

    if (!form.fullName.trim()) {
      setError("Nama lengkap wajib diisi.");
      setLoading(false);
      return;
    }
    if (!form.sid.trim()) {
      setError("SID atau NIM wajib diisi.");
      setLoading(false);
      return;
    }
    if (!form.email.trim()) {
      setError("Email wajib diisi.");
      setLoading(false);
      return;
    }
    if (!form.group) {
      setError("Silakan pilih grup terlebih dahulu.");
      setLoading(false);
      return;
    }
    if (!form.password.trim()) {
      setError("Kata sandi wajib diisi.");
      setLoading(false);
      return;
    }

    try {
      const result = await registerAction({
        fullName: form.fullName,
        sid: form.sid,
        email: form.email,
        group: form.group,
        password: form.password,
      });

      if ("error" in result) {
        setError(result.error);
        setLoading(false);
        return;
      }

      if (result.needsEmailConfirmation) {
        setSuccessMessage("Pendaftaran berhasil. Silakan cek email untuk mengonfirmasi akun, lalu masuk.");
        setLoading(false);
        return;
      }

      router.push("/projects");
    } catch (caughtError) {
      console.error("Sign up error:", caughtError);
      setError("Terjadi kesalahan. Silakan coba lagi.");
      setLoading(false);
    }
  };

  return (
    <main className={styles.authShell}>
      <aside className={styles.brandPanel} aria-label="Riset">
        <div className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="1.8" strokeDasharray="2.5 2.5" />
              <path d="m11.5 16.5 3 3 6-6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span>Riset</span>
        </div>
        <div className={styles.brandMessage}>
          <h2>Bangun riset yang saling terhubung.</h2>
          <p>Satukan artikel, keterkaitannya, dan catatan riset Anda dalam satu ruang kerja.</p>
        </div>
      </aside>

      <section className={styles.formPanel} aria-labelledby="register-title">
        <div className={styles.formWrap}>
          <h1 className={styles.title} id="register-title">Buat akun</h1>
          <p className={styles.intro}>Siapkan akun untuk mulai menata riset Anda.</p>

          <form className={styles.form} onSubmit={handleSignUp}>
            {error && <p className={styles.error} role="alert">{error}</p>}

            <div className={styles.field}>
              <label className={styles.label} htmlFor="register-name">Nama lengkap</label>
              <input
                className={styles.input}
                id="register-name"
                name="fullName"
                type="text"
                autoComplete="name"
                placeholder="Nama lengkap Anda"
                value={form.fullName}
                onChange={(event) => updateForm("fullName", event.currentTarget.value)}
                disabled={loading}
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="register-sid">SID atau NIM</label>
              <input
                className={styles.input}
                id="register-sid"
                name="sid"
                type="text"
                inputMode="numeric"
                pattern="\d*"
                autoComplete="off"
                placeholder="Masukkan SID atau NIM"
                value={form.sid}
                onChange={handleSidChange}
                disabled={loading}
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="register-email">Email</label>
              <input
                className={styles.input}
                id="register-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="nama@organisasi.com"
                value={form.email}
                onChange={(event) => updateForm("email", event.currentTarget.value)}
                disabled={loading}
                required
              />
            </div>

            <fieldset className={`${styles.field} ${styles.groupField}`}>
              <legend className={styles.label}>Grup</legend>
              <div className={styles.groupOptions}>
                {["A", "B"].map((group) => (
                  <label className={styles.groupOption} key={group}>
                    <input
                      type="radio"
                      name="group"
                      value={group}
                      checked={form.group === group}
                      onChange={(event) => updateForm("group", event.currentTarget.value)}
                      disabled={loading}
                      required
                    />
                    <span>Grup {group}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="register-password">Kata sandi</label>
              <div className={styles.passwordField}>
                <input
                  className={styles.passwordInput}
                  id="register-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(event) => updateForm("password", event.currentTarget.value)}
                  disabled={loading}
                  required
                />
                <button
                  className={styles.passwordToggle}
                  type="button"
                  aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((visible) => !visible)}
                  disabled={loading}
                >
                  {showPassword ? "Sembunyikan" : "Tampilkan"}
                </button>
              </div>
              <p className={styles.formNote}>Gunakan kata sandi yang tidak Anda pakai di layanan lain.</p>
            </div>

            <button className={styles.submit} type="submit" disabled={loading}>
              <span>{loading ? "Mendaftar..." : "Buat akun"}</span>
              <span className={styles.submitArrow} aria-hidden="true">→</span>
            </button>
          </form>

          {successMessage && <p className={styles.success} role="status" aria-live="polite">{successMessage}</p>}

          <p className={styles.registerPrompt}>
            Sudah punya akun? <Link href="/login">Masuk di sini</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
