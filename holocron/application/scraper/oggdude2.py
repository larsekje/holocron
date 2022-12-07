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


def get_source(foo: dict) -> list[Source]:
    if 'Sources' in foo and 'Source' in foo['Sources']:
        return [Source.from_oggdude(source) for source in foo['Sources']['Source']]
    elif 'Source' in foo:
        return [Source.from_oggdude(foo['Source'])]
    else:
        return []


def format_mod_options(added_mods: dict) -> list[str]:
    descriptors = oggdude2000('ItemDescriptors.xml')

    formatted_mods = []
    for mod in added_mods['Mod']:
        key = mod['Key']
        count = mod['Count']
        descriptor = descriptors[key]
        description = descriptor['ModDesc']
        if 'IsQuality' in descriptor.keys() and descriptor['IsQuality'] == 'true':
            formatted_mod = f"{count} Weapon Quality ({description.replace('{0}', '+1')}) {'Mods' if int(count) > 1 else 'Mod'}"
        else:
            formatted_mod = f"{count} {description} {'Mods' if int(count) > 1 else 'Mod'}"

        formatted_mods.append(formatted_mod)

    return formatted_mods


if __name__ == '__main__':
    foo = oggdude2000('ItemAttachments.xml')

    foo = list(foo.values())[2]

    sources = []
    for source in foo['Sources']['Source']:
        sources.append({'text': source['#text'], 'page': int(source['@Page'])})

    name = foo['Name']
    description = foo['Description']
    hp = int(foo['HP'])
    price = int(foo['Price'])
    rarity = int(foo['Rarity'])
    type = foo['Type'].lower()
    options = format_mod_options(foo['AddedMods'])
    description, models = description.split('[P][B]Models Include:[b] ')

    string = json.dumps(foo, indent=1)
    print(string)

    ia = ItemAttachment(name,
                   description,
                   models,
                   None,
                   options,
                   hp,
                   price,
                   rarity,
                   0,
                   type,
                   sources
                   )

    print(ia)


