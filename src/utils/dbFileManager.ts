import { dbFile } from "../types";
import * as fs from "fs";

export const data = JSON.parse(fs.readFileSync("./db.json", "utf-8")) as dbFile;

setInterval(
    () =>
        fs.promises
            .writeFile("./db.json", JSON.stringify(data), "utf-8")
            .then(() => console.count("save")),
    1 * 1000 * 15
);
