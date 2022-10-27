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

  async get(): Promise<TType> {
    if (existsSync(this.opts.fileName)) {
      const fd = await readFile(this.opts.fileName, "utf-8");
      return this.opts.decoder(fd);
    } else {
      return this.save(this.opts.defaultValue);
    }
  }
  async save(data: TType): Promise<TType> {
    await writeFile(this.opts.fileName, this.opts.encoder(data));
    return data;
  }
}
