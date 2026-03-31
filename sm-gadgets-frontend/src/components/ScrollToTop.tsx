import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "instant" });
        const timeout = setTimeout(() => {
            window.scrollTo({ top: 0, behavior: "instant" });
            document.documentElement.scrollTo({ top: 0, behavior: "instant" });
        }, 50);
        return () => clearTimeout(timeout);
    }, [pathname]);

    return null;
}
