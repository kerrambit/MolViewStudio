import { useEffect, useState } from "react";
import reactLogo from "../assets/react.svg";
import "./Counter.css";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function Counter() {
    const [count, setCount] = useState(0);
    const { t } = useTranslation();

    useEffect(() => {
        const unsubscribe = window.electron.subscribeData((data) => {
            console.log(data);
        });
        return unsubscribe; // We will unsubscribe if the component unmounts, or any dependency in dependency array changes.
    }, []);

    return (
        <>
            <nav>
                <Link to="/">{t("Home")}</Link> |{" "}
                <Link to="/settings">{t("Settings")}</Link> |{" "}
                <Link to="/counter">{t("Counter")}</Link>
            </nav>

            <div>
                <img src={reactLogo} className="logo react" alt="React logo" />
            </div>
            <h1>{t("Counter")}</h1>
            <div className="card">
                <button onClick={() => setCount((count) => count + 1)}>
                    {t("count is")} {count}
                </button>
            </div>
        </>
    );
}
