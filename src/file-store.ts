import { readFile, writeFile } from "fs/promises";
import { existsSync } from "fs";

type Encoder<TType = any> = (data: TType) => string;
type Decoder<TType = any> = (data: string) => TType;

type FileStoreOptions<TType> = {
  fileName: string;
  defaultValue: TType;
  encoder: Encoder<TType>;
  decoder: Decoder<TType>;
};

export class FileStore<TType = any> {
  constructor(private opts: FileStoreOptions<TType>) {}

  cache: TType | null;

  async get(): Promise<TType> {
    if (this.cache) return this.cache;

    if (existsSync(this.opts.fileName)) {
      const fd = await readFile(this.opts.fileName, "utf-8");
      const coded = this.opts.decoder(fd);
      this.cache = coded;
      return coded;
    } else {
      return this.save(this.opts.defaultValue);
    }
  }
  async save(data: TType): Promise<TType> {
    this.cache = data;
    const coded = this.opts.encoder(data);
    await writeFile(this.opts.fileName, coded);
    return data;
  }
}
