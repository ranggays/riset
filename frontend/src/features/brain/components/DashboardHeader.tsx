"use client";

import { useEffect, useState } from "react";
import { IconHelp, IconLogout, IconMenu2, IconMoon, IconSun, IconUser } from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authLogout } from "../api/auth";
import { getUser } from "../api/brainstormingSessions";
import { HelpGuideModal } from "./HelpGuideModal";
import styles from "../Dashboards.module.css";

interface DashboardHeaderProps {
  sidebarOpened: boolean;
  onToggleSidebar: () => void;
  mounted: boolean;
  colorScheme: "light" | "dark";
  onToggleColorScheme: () => void;
}

interface UserData {
  name: string;
  email: string;
}

export function DashboardHeader({ sidebarOpened, onToggleSidebar, mounted, colorScheme, onToggleColorScheme }: DashboardHeaderProps) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [logoutError, setLogoutError] = useState("");
  const [helpModalOpened, setHelpModalOpened] = useState(false);
  const router = useRouter();
  const dark = mounted && colorScheme === "dark";

  useEffect(() => {
    if (!mounted) return;
    let active = true;

    const fetchUserData = async () => {
      try {
        const response = await getUser();
        if (active) {
          setUserData({
            name: response.user.name || "Unknown User",
            email: response.user.email || "No email",
          });
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void fetchUserData();
    return () => { active = false; };
  }, [mounted]);

  const handleLogout = async () => {
    setLogoutError("");
    setIsLoading(true);
    try {
      await authLogout();
      router.push("/login");
    } catch (error) {
      console.error("Logout gagal:", error);
      setLogoutError("Logout gagal. Silakan coba lagi.");
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className={styles.headerInner}>
        <div className={styles.topbarLeading}>
          <button
            aria-controls="primary-sidebar"
            aria-expanded={sidebarOpened}
            aria-label={sidebarOpened ? "Ciutkan navigasi" : "Buka navigasi"}
            className={styles.iconButton}
            onClick={onToggleSidebar}
            type="button"
          >
            <IconMenu2 size={19} aria-hidden="true" />
          </button>
          <Link className={styles.brand} href="/" aria-label="Riset">
            <span className={styles.brandSeal} aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="1.8" strokeDasharray="2.5 2.5" />
                <path d="m11.5 16.5 3 3 6-6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className={styles.brandName}>Riset</span>
            <span className={styles.brandCaption}>Ruang Kerja Riset</span>
          </Link>
        </div>

        <div className={styles.topbarActions}>
          <button
            aria-label="Panduan Penggunaan"
            className={styles.iconButton}
            onClick={() => setHelpModalOpened(true)}
            title="Panduan Penggunaan"
            type="button"
          >
            <IconHelp size={18} aria-hidden="true" />
          </button>
          <button
            aria-label={dark ? "Ganti ke tema terang" : "Ganti ke tema gelap"}
            className={styles.iconButton}
            disabled={!mounted}
            onClick={onToggleColorScheme}
            title={dark ? "Tema terang" : "Tema gelap"}
            type="button"
          >
            {dark ? <IconSun size={18} aria-hidden="true" /> : <IconMoon size={18} aria-hidden="true" />}
          </button>

          <details className={styles.profileMenu}>
            <summary className={styles.profileTrigger} aria-label="Menu pengguna">
              <span className={styles.profileMonogram} aria-hidden="true">
                {isLoading ? "…" : userData?.name?.charAt(0).toUpperCase() || <IconUser size={15} />}
              </span>
              <span className={styles.profileTriggerText}>{userData?.name || "Akun"}</span>
            </summary>
            <div className={styles.profileDropdown}>
              <div className={styles.profileIdentity}>
                <strong>{isLoading ? "Loading..." : userData?.name || "Unknown User"}</strong>
                <span>{isLoading ? "Loading..." : userData?.email || "No email"}</span>
                <span>Signed in as</span>
              </div>
              {logoutError && <p className={styles.formError} role="alert">{logoutError}</p>}
              <button className={`${styles.menuButton} ${styles.menuDanger}`} disabled={isLoading} onClick={handleLogout} type="button">
                <IconLogout size={16} aria-hidden="true" /> Sign out
              </button>
            </div>
          </details>
        </div>
      </div>

      <HelpGuideModal opened={helpModalOpened} onClose={() => setHelpModalOpened(false)} />
    </>
  );
}
