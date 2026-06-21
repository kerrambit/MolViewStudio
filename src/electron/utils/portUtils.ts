import net from "net";

/**
 * Retrieves available port.
 * @param desiredPort prefered port to use, this one will be checked first
 * @returns available port, desiredPort if free
 */
export function getAvailablePort(desiredPort: number): Promise<number> {
    return new Promise((resolve) => {
        const server = net.createServer();

        server.listen(desiredPort, "127.0.0.1", () => {
            const port = (server.address() as net.AddressInfo).port;
            server.close(() => resolve(port));
        });

        server.on("error", () => {
            const fallbackServer = net.createServer();
            fallbackServer.listen(0, "127.0.0.1", () => {
                const port = (fallbackServer.address() as net.AddressInfo).port;
                fallbackServer.close(() => resolve(port));
            });
        });
    });
}
