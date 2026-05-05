"use client";

import { useTranslations } from "next-intl";

export function useT() {
  const sidebar = useTranslations("sidebar");
  const issues = useTranslations("issues");
  const agents = useTranslations("agents");
  const common = useTranslations("common");
  const settings = useTranslations("settings");

  return { sidebar, issues, agents, common, settings };
}
