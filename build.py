#!/usr/bin/env python3
import argparse
import os
import shutil
from io import StringIO

import htmlmin
import lesscpy
from jsmin import jsmin


def get_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="App Builder",
    )
    parser.add_argument(
        "-m",
        "--minify",
        action="store_true",
        help="shrink the app's source code removing unnecesary spaces, etc.",
    )

    return parser


def cat(paths) -> str:
    contents = []
    for path in paths:
        with open(path) as file:
            contents.append(file.read())
    return "\n".join(contents)


if __name__ == "__main__":
    args = get_parser().parse_args()
    app_archive = "Triska.xdc"

    shutil.rmtree("build", ignore_errors=True)
    os.makedirs("build")
    if os.path.exists(app_archive):
        os.remove(app_archive)

    # ADD JS
    script = cat(
        [
            "src/config.js",
            "src/globals.js",
            "src/graphics.js",
            "src/utils.js",
            "src/game.js",
            "src/camera.js",
            "src/item.js",
            "src/player.js",
            "src/obstacle.js",
            "src/menu.js",
            "src/main-menu.js",
            "src/rng.js",
        ]
    )
    if args.minify:
        script = jsmin(script).replace("\n", ";")
    with open("build/index.js", "w") as file:
        file.write(script)

    # ADD CSS
    css = cat(
        [
            "src/style.css",
            "src/w3.css",
        ]
    )
    if args.minify:
        css = lesscpy.compile(StringIO(css), minify=True, xminify=True)
    with open("build/style.css", "w") as file:
        file.write(css)

    # ADD HTML
    with open("src/index.html") as file:
        html = file.read()
    if args.minify:
        html = htmlmin.minify(html)
    with open("build/index.html", "w") as file:
        file.write(html)

    # ADD METADATA
    shutil.copyfile("images/icon.png", "build/icon.png")
    shutil.copyfile("manifest.toml", "build/manifest.toml")

    project_root = os.path.abspath(".")
    os.chdir("build")
    shutil.make_archive(f"{project_root}/{app_archive}", "zip")
    os.chdir(project_root)
    os.rename(f"{app_archive}.zip", app_archive)
    shutil.copyfile("webxdc.js", "build/webxdc.js")
