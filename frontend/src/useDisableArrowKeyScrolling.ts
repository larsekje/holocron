import {useEffect} from "react";

function useDisableArrowKeyScrolling() {
    useEffect(() => {
        function disableArrowKeys(event: globalThis.KeyboardEvent) {
            const arrowKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
            if (arrowKeys.includes(event.key)) {
                event.preventDefault();
            }
        }

        document.addEventListener("keydown", disableArrowKeys, false);

        return () => {
            document.removeEventListener("keydown", disableArrowKeys, false);
        };
    }, []);
}

export default useDisableArrowKeyScrolling