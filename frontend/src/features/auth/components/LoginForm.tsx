"use client";

import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { loginAction } from "../actions/actions";
import styles from "./AuthForm.module.css";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [forgotPasswordOpened, setForgotPasswordOpened] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetUnavailable, setResetUnavailable] = useState(false);

  const resetDialog = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const errorFromCallback = searchParams.get("error");
  let visibleError = error;
  if (!visibleError && errorFromCallback) {
    try {
      visibleError = decodeURIComponent(errorFromCallback);
    } catch {
      visibleError = errorFromCallback;
    }
  }

  useEffect(() => {
    const dialog = resetDialog.current;
    if (!dialog) return;

    if (forgotPasswordOpened && !dialog.open) dialog.showModal();
    if (!forgotPasswordOpened && dialog.open) dialog.close();
  }, [forgotPasswordOpened]);

  const handleSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await loginAction({ email, password });
      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }
      if (!result.success) {
        setError("Login gagal. Silakan coba lagi.");
        setLoading(false);
        return;
      }

      router.push("/projects");
      setLoading(false);
      setEmail("");
      setPassword("");
    } catch (caughtError) {
      console.error("Sign in error:", caughtError);
      setError("Terjadi kesalahan. Silakan coba lagi.");
      setLoading(false);
    }
  };

  const closeResetDialog = () => {
    setForgotPasswordOpened(false);
    setResetEmail("");
    setResetUnavailable(false);
  };

  const handleResetDialogClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) closeResetDialog();
  };

  const handleResetPassword = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResetUnavailable(true);
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
          <h2>Lanjutkan riset Anda.</h2>
          <p>Simpan artikel, keterkaitannya, dan catatan riset Anda dalam satu ruang kerja.</p>
        </div>
      </aside>

      <section className={styles.formPanel} aria-labelledby="login-title">
        <div className={styles.formWrap}>
          <h1 className={styles.title} id="login-title">Masuk</h1>
          <p className={styles.intro}>Masukkan email Anda untuk login ke akun Anda.</p>

          <form className={styles.form} onSubmit={handleSignIn}>
            {visibleError && <p className={styles.error} role="alert">{visibleError}</p>}

            <div className={styles.field}>
              <label className={styles.label} htmlFor="login-email">Email</label>
              <input
                className={styles.input}
                id="login-email"
                name="email"
                type="email"
                autoComplete="username"
                placeholder="Masukkan email Anda..."
                value={email}
                onChange={(event) => setEmail(event.currentTarget.value)}
                disabled={loading}
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="login-password">Kata Sandi</label>
              <div className={styles.passwordField}>
                <input
                  className={styles.passwordInput}
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.currentTarget.value)}
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
            </div>

            <div className={styles.formOptions}>
              <label className={styles.remember}>
                <input
                  type="checkbox"
                  name="remember"
                  checked={remember}
                  onChange={(event) => setRemember(event.currentTarget.checked)}
                  disabled={loading}
                />
                <span>Ingat saya</span>
              </label>
              <button
                className={styles.textButton}
                type="button"
                onClick={() => setForgotPasswordOpened(true)}
                disabled={loading}
              >
                Lupa kata sandi?
              </button>
            </div>

            <button className={styles.submit} type="submit" disabled={loading}>
              <span>{loading ? "Masuk..." : "Masuk"}</span>
              <span className={styles.submitArrow} aria-hidden="true">→</span>
            </button>
          </form>

          <p className={styles.registerPrompt}>
            Belum punya akun? <Link href="/register">Daftar di sini</Link>
          </p>
        </div>
      </section>

      <dialog
        className={styles.resetDialog}
        ref={resetDialog}
        aria-labelledby="reset-title"
        onClose={closeResetDialog}
        onClick={handleResetDialogClick}
      >
        <div className={styles.dialogHeader}>
          <h2 id="reset-title">Reset Password</h2>
          <button className={styles.dialogClose} type="button" onClick={closeResetDialog} aria-label="Tutup dialog">×</button>
        </div>
        <form className={styles.resetForm} onSubmit={handleResetPassword}>
          <p>Masukkan email Anda untuk memulai reset kata sandi.</p>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="reset-email">Email</label>
            <input
              className={styles.input}
              id="reset-email"
              name="resetEmail"
              type="email"
              autoComplete="email"
              placeholder="email@example.com"
              value={resetEmail}
              onChange={(event) => setResetEmail(event.currentTarget.value)}
              required
            />
          </div>
          {resetUnavailable && (
            <p className={styles.resetNotice} role="status">
              Fitur reset kata sandi belum tersedia. Silakan hubungi administrator.
            </p>
          )}
          <div className={styles.dialogActions}>
            <button className={styles.cancelButton} type="button" onClick={closeResetDialog}>Batal</button>
            <button className={styles.submit} type="submit">Kirim Link Reset</button>
          </div>
        </form>
      </dialog>
    </main>
  );
}
