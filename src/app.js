require("dotenv").config();

const Express = require("express");
const { Client } = require("@notionhq/client");

const app = new Express();
app.use(Express.json());

app.use("/product-issue", (req, res) => {
  res.send("OK");
  const receivedBody = req.body.data;
  const changes = req?.body?.changes;
  if (changes?.attributes?.custom) {
    const conversationId = receivedBody.id;
    const custom = receivedBody.attributes.custom;

    if (custom?.submitProductIssueBool) {
      const productData = {
        Title: {
          title: [
            {
              text: {
                content: "New Product Issue",
              },
            },
          ],
        },
        Name: {
          rich_text: [
            {
              type: "text",
              text: {
                content: custom?.nameStr || "-",
                link: null,
              },
            },
          ],
        },
        "Order Number": {
          rich_text: [
            {
              type: "text",
              text: {
                content: custom?.orderNumberStr || "-",
                link: null,
              },
            },
          ],
        },

        Channel: {
          rich_text: [
            {
              type: "text",
              text: {
                content: custom?.channelsStr || "-",
                link: null,
              },
            },
          ],
        },
        "Product / SKU": {
          rich_text: [
            {
              type: "text",
              text: {
                content: custom?.productSkuTree || "-",
                link: null,
              },
            },
          ],
        },
        "Batch #": {
          rich_text: [
            {
              type: "text",
              text: {
                content: custom?.batchStr || "-",
                link: null,
              },
            },
          ],
        },
        "Product Issue": {
          rich_text: [
            {
              type: "text",
              text: {
                content: custom?.productIssueTree || "-",
                link: null,
              },
            },
          ],
        },
        Resolution: {
          rich_text: [
            {
              type: "text",
              text: {
                content: custom?.resolutionTree || "-",
                link: null,
              },
            },
          ],
        },
        "Description of Issue": {
          rich_text: [
            {
              type: "text",
              text: {
                content: custom?.descriptionOfIssueTxt || "-",
                link: null,
              },
            },
          ],
        },
      };
      if (custom?.dateOfOrderAt) {
        productData["Date of Order"] = {
          date: {
            start: custom?.dateOfOrderAt,
            end: null,
          },
        };
      }
      if (custom?.dateIssueReportedAt) {
        productData["Date Issue Reported"] = {
          date: {
            start: custom?.dateIssueReportedAt || "",
            end: null,
          },
        };
      }
      upsertNotionRow(conversationId, productData);
    }
  }
});

const notion = new Client({ auth: process.env.NOTION_TOKEN });

async function upsertNotionRow(conversationId, otherFields) {
  try {
    const searchResults = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_ID,
      filter: {
        property: "ConversationId",
        rich_text: {
          equals: conversationId,
        },
      },
    });

    if (searchResults.results.length > 0) {
      const pageId = searchResults.results[0].id;
      console.log("Record exists, updating page ID:", pageId);
      await notion.pages.update({
        page_id: pageId,
        properties: otherFields,
      });
    } else {
      console.log("Record does not exist, creating new one.");
      await notion.pages.create({
        parent: { database_id: process.env.NOTION_DATABASE_ID },
        properties: {
          ConversationId: {
            rich_text: [
              {
                type: "text",
                text: {
                  content: conversationId,
                  link: null,
                },
              },
            ],
          },
          ...otherFields,
        },
      });
    }
  } catch (err) {
    console.error("Error upserting Notion record:", err);
  }
}

app.listen(3000, () => console.log("App listen on 3000."));
