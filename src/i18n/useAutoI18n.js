import { useTranslation } from "react-i18next";

export const useAutoI18n = () => {
  const { t } = useTranslation();

  const translate = (text) => {
    if (!text) return "";
    
    // Tái tạo lại key đúng format đang lưu trên Locize (menu.xxx_yyy)
    const key = "menu." + text.toLowerCase().trim().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    
    // Gọi t(key, defaultValue) để nếu chưa có dịch nó hiện text gốc
    return t(key, text);
  };

  return { translate };
};