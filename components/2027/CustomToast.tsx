import { ToastProps } from "@/lib/types";
import { FaCircleInfo, FaXmark } from "react-icons/fa6";

const CustomToast = ({ toastMessage, setToastMessage }: ToastProps) => {
	return (
		<div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-sm z-50">
			<div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-4 border-2 border-ink bg-chrome-200 text-ink font-bold shadow-[4px_4px_0px_0px_var(--color-ink)]">
				<div className="flex items-center gap-2.5 min-w-0 flex-1">
					<FaCircleInfo className="w-4 h-4 sm:w-5 sm:h-5 text-ink shrink-0" />
					<span className="text-xs sm:text-sm font-mono tracking-wide leading-snug break-words">
						{toastMessage}
					</span>
				</div>
				<button
					onClick={() => setToastMessage(null)}
					className="ml-2 hover:text-destructive transition-colors focus:outline-none cursor-pointer shrink-0"
					aria-label="Close notification"
				>
					<FaXmark className="w-4 h-4" />
				</button>
			</div>
		</div>
	);
};

export default CustomToast;