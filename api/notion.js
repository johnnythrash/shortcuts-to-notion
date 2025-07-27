export default async function handler(req, res) {
  console.log("Function started");
  console.log("Body:", req.body);
  console.log("Has token:", !!process.env.NOTION_TOKEN);
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, focusArea, type, tags } = req.body;
  const notionTypes =
    type && type.length > 0 ? type.map((item) => ({ name: item })) : [];
  const dateStr = new Date().toISOString().split("T")[0];

  // Build Notion API request
  // prettier-ignore
  const notionPayload = {
  "parent": {
    "type": "database_id",
    "database_id": process.env.NOTION_DATABASE_ID
  },
  "properties": {
    "Name": {
      "type": "title",
      "title": [
        {
          "type": "text",
          "text": { "content": name}
        }
      ]
    },
    "Focus Area": {
      "type": "select",
      "select": { "name": focusArea }
    },
    "Type": {
      "type": "multi_select",
      "multi_select":
				notionTypes
    },
		"Tags": {
    "type": "multi_select",
    "multi_select": [{ "name": "inbox" }]
  },
    "Date": {
      "type": "date",
      "date": { "start": dateStr }
    }
  }
}

  try {
    // Send to Notion API
    const response = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify(notionPayload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.log("Notion API error:", errorData);
      return res.status(500).json({
        error: "Failed to create Notion page",
        details: errorData,
      });
    }

    const result = await response.json();
    return res.json({ success: true, data: result });
  } catch (error) {
    console.log("Fetch error:", error);
    return res.status(500).json({
      error: "Server error",
      message: error.message,
    });
  }
}
