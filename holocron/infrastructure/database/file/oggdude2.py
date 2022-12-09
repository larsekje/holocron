import os
import re

import xmltodict, json

from holocron.definitions import OGGDUDE_PATH
from holocron.domain.item_attachment import ItemAttachment
from holocron.domain.source import Source


def xml2dict(xml: str, *args: str) -> dict:
    dict = xmltodict.parse(xml)

    for arg in args:
        dict = dict[arg]

    return dict


def read_oggdude(file: str) -> str:
    path = os.path.join(OGGDUDE_PATH, file)

    with open(path, encoding='utf8') as f:
        contents = f.read()
        return filter(contents)


def make_oggude_queryable(foo: dict) -> dict:
    new_dict = {}

    for item in foo:
        key = item['Key']
        item.pop('Key')

        new_dict.update({key: item})

    return new_dict


def filter(data: str) -> str:
    data = re.sub(r"\[H\d].+\[h\d]", "", data)  # Remove headings
    data = re.sub(r"\n", "", data)  # Remove random newlines
    data = re.sub(r" {2,}", " ", data)  # Remove weird double spaces

    data = data.replace("<Sources />", "")
    data = data.replace("[B]", "")
    data = data.replace("[b]", "")

    # dice
    data = re.sub(r"(\[DIFFICULTY]){5}", ":impossible:", data)
    data = re.sub(r"(\[DIFFICULTY]){4}", ":formidable:", data)
    data = re.sub(r"(\[DIFFICULTY]){3}", ":hard:", data)
    data = re.sub(r"(\[DIFFICULTY]){2}", ":average:", data)
    data = re.sub(r"\[DIFFICULTY]", ":easy:", data)
    return data


def oggdude2000(file):
    xml = read_oggdude(file)
    name, ext = file.split('.')
    o = xml2dict(xml, name, name[:-1])
    return o
