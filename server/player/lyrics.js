import dotenv from "dotenv";
import { StatusCodes } from "http-status-codes";

dotenv.config();

export async function lyrics(req, res) {
    const queryParams = req.url.split("?")[1];
    fetch(`https://lrclib.net/api/get?${queryParams}`, {
        headers: {
            "User-Agent": `${process.env.npm_package_name} v${process.env.npm_package_version} ${process.env.PROJECT_REPO_URL}`,
        },
    }).then((fetchLyricRes) => {
        if (fetchLyricRes.status == StatusCodes.OK) {
            fetchLyricRes
                .json()
                .then((json) => res.status(StatusCodes.OK).json(json));
        } else if (fetchLyricRes.status == StatusCodes.NOT_FOUND) {
            res.status(StatusCodes.NOT_FOUND).end();
        } else {
            res.status(fetchLyricRes).end();
        }
    });
}
