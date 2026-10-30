import { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api";

export type SiteContent = Record<string, string>;
const defaults: SiteContent = {
  hero_title: "Connecting Talent with Opportunity",
  hero_subtitle: "MBONO Recruitment Services helps skilled professionals find meaningful career opportunities while helping companies recruit top talent.",
  contact_email: "info@mbono.co.za",
  contact_phone: "+27 41 123 4567",
  contact_address: "Nelson Mandela Bay, Gqeberha, Eastern Cape, South Africa",
  office_hours: "Mon - Fri: 08:00 - 17:00",
  announcement: "",
};
const Ctx = createContext<{ content: SiteContent; reload: () => void }>({ content: defaults, reload: () => {} });
export const useContent = () => useContext(Ctx).content;
export const useReloadContent = () => useContext(Ctx).reload;

/** Website content managed by the admin (hero text, contact details, announcement). */
export function ContentProvider({ children }: { children: React.ReactNode }) {
  const [content, setContent] = useState(defaults);
  const reload = () => api<SiteContent>("/content").then(c => setContent({ ...defaults, ...c })).catch(() => {});
  useEffect(() => { reload(); }, []);
  return <Ctx.Provider value={{ content, reload }}>{children}</Ctx.Provider>;
}
