export interface LinkOpener {
    openUrl(url: string): Promise<void>
}