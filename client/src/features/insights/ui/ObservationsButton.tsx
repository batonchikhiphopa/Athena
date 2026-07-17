import { Icon } from "../../../components/icon";
import { TooltipButton } from "../../../components/TooltipButton";
import { useI18n } from "../../../i18n/useI18n";

export function ObservationsButton({
  hasUnread,
  onClick,
}: {
  hasUnread: boolean;
  onClick: () => void;
}) {
  const { t } = useI18n();

  return (
    <TooltipButton
      aria-label={t("nav.observations")}
      className={[
        "pointer-events-auto relative flex h-9 w-9 shrink-0 items-center justify-center overflow-visible rounded-full bg-transparent text-zinc-400 transition hover:bg-transparent hover:text-zinc-700 hover:opacity-100",
        hasUnread ? "athena-observations-unread text-amber-700" : "opacity-50",
      ].join(" ")}
      data-testid="open-observations"
      onClick={onClick}
      tooltip={t("nav.observations")}
      tooltipPlacement="left"
      type="button"
    >
      {hasUnread && (
        <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-amber-500" />
      )}
      <Icon name="observations" className="relative z-10 h-5 w-5" />
    </TooltipButton>
  );
}
