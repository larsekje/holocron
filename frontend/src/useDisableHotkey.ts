import {useEffect} from "react";

function useDisableHotkey(keys: string[]) {
    useEffect(() => {
        function disableHotkey(event: globalThis.KeyboardEvent) {
            if (keys.includes(event.key)) {
                event.preventDefault();
            }
        }

        document.addEventListener("keydown", disableHotkey, false);

        return () => {
            document.removeEventListener("keydown", disableHotkey, false);
        };
    }, []);
}

export default useDisableHotkey