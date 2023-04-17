import React from 'react';
import {diceMap} from "@/utils";
import {Link, useToast} from "@chakra-ui/react"

interface Props {

}

const ClickableText = ({}: Props) => {

  const innerHTML = {__html: diceMap["average"]};
  const toast = useToast();

  return (
    <Link
      userSelect="none"
      cursor="pointer"
      dangerouslySetInnerHTML={innerHTML}
      onClick={() =>
        toast({
          title: "Clicked something",
          duration: 2000,
        })
      }
      color="white"
    />
  );
};

export default ClickableText;
