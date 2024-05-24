/**
 * game service
 */

import { JSDOM } from "jsdom";
import axios from "axios";
import { factories } from "@strapi/strapi";
import slugify from "slugify";

function customReplaceAll(str, target, replacement) {
  let result = "";

  for (let i = 0; i < str.length; i++) {
    if (str.substr(i, target.length) === target) {
      result += replacement;
      i += target.length - 1;
    } else {
      result += str[i];
    }
  }

  return result;
}

// Usage to match your example

async function getGameInfo(slug) {
  const gogSlug = customReplaceAll(slug, "-", "_").toLowerCase();

  const body = await axios.get(`https://www.gog.com/game/${gogSlug}`);
  const dom = new JSDOM(body.data);

  const description = dom.window.document.querySelector(".description");

  const raw_description = description.innerHTML;
  const short_description = description.textContent.slice(0, 160);

  const ratingElement = dom.window.document.querySelector(
    ".age-restrictions__icon use"
  );

  return {
    description,
    short_description,
    raw_description,
    rating: ratingElement
      ? ratingElement
          .getAttribute("xlink:href")
          .replace(/_/g, "")
          .replace("#", "")
      : "BR0",
  };
}

export default factories.createCoreService("api::game.game", () => ({
  async populate(params) {
    const gogApiUrl = `https://catalog.gog.com/v1/catalog?limit=48&order=desc%3Atrending`;

    const {
      data: { products },
    } = await axios.get(gogApiUrl);

    products[1].developers.map(async (developer) => {
      await strapi.service("api::developer.developer").create({
        data: {
          name: developer,
          slug: slugify(developer, { strict: true, lower: true }),
        },
      });
    });

    products[1].publishers.map(async (publisher) => {
      await strapi.service("api::publisher.publisher").create({
        data: {
          name: publisher,
          slug: slugify(publisher, { strict: true, lower: true }),
        },
      });
    });

    // console.log(await getGameInfo(products[0].slug));
  },
}));
