import styles from "../Dashboards.module.css";

export const COVER_COLORS = [
  "#4c6ef5", "#51cf66", "#ff6b6b", "#ffd43b", "#9775fa", "#40c057",
  "#fd7e14", "#15aabf", "#748ffc", "#69db7c", "#ffa8a8", "#ffe066",
];

interface CoverColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

export function CoverColorPicker({ value, onChange, label = "Warna Cover" }: CoverColorPickerProps) {
  return (
    <fieldset className={styles.colorField}>
      <legend className={styles.fieldLabel}>{label}</legend>
      <div className={styles.colorSwatches}>
        {COVER_COLORS.map((color) => (
          <button
            aria-label={`Pilih warna ${color}`}
            aria-pressed={value === color}
            className={`${styles.swatch} ${value === color ? styles.swatchSelected : ""}`}
            key={color}
            onClick={() => onChange(color)}
            style={{ backgroundColor: color }}
            type="button"
          />
        ))}
      </div>
      <span className={styles.selectedColor}>
        <span className={styles.selectedColorMark} style={{ backgroundColor: value }} aria-hidden="true" />
        Warna terpilih: {value}
      </span>
    </fieldset>
  );
}
