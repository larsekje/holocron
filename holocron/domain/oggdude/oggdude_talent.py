from dataclasses import dataclass

from holocron.domain.oggdude.oggdude_item import OggdudeItem
from holocron.domain.talent import Talent


@dataclass(init=False)
class OggdudeTalent(OggdudeItem):
    ranked: bool
    activation: str

    def __init__(self, content):
        super().__init__(content)
        self.ranked = OggdudeTalent.get_ranked(content)
        self.activation = OggdudeTalent.get_activation(content)

    @staticmethod
    def get_ranked(content) -> bool:
        return OggdudeItem.get_bool_or_default(content, 'Ranked', False)

    @staticmethod
    def get_activation(content) -> str:
        activation = content['ActivationValue']
        activation = activation[2:]  # first 2 characters are always 'ta'
        activation = activation.replace("IncidentalOOT", "Out-of-turn Incidental")
        return activation

    @property
    def model(self) -> Talent:
        return Talent(
            self.key,
            self.name,
            self.description,
            self.ranked,
            self.activation,
            [source.model for source in self.source]
        )
