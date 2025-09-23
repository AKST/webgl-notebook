export interface ConfigSource {
  monitorConfig(id: string, label: string, min: number, max: number, value: number, onChange: (v: number) => void): void;
}
