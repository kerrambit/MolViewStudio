import { useEffect, useState } from "react";
import reactLogo from "../assets/react.svg";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./Counter.css";
import { Button } from "../components/common/Button/Button";

export function Counter() {
    const [count, setCount] = useState(0);
    const { t } = useTranslation();

    useEffect(() => {
        const unsubscribe = window.electron.subscribeData((data) => {
            console.log(data);
        });
        return unsubscribe;
    }, []);

    return (
        <>
            <nav>
                <Link to="/">{t("Home")}</Link> |{" "}
                <Link to="/settings">{t("Settings")}</Link> |{" "}
                <Link to="/counter">{t("Counter")}</Link> |{" "}
                <Link to="/server-status">Server status</Link> |{" "}
            </nav>

            <div>
                <img src={reactLogo} className="logo react" alt="React logo" />
            </div>
            <h1>{t("Counter")}</h1>
            <div className="card">
                <Button onClick={() => setCount((count) => count + 1)}>
                    {t("count is")} {count}
                </Button>
            </div>
        </>
    );
}
