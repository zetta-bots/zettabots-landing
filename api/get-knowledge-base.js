export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { instanceName } = req.body;

  if (!instanceName) {
    return res.status(400).json({ error: 'instanceName required' });
  }

  const sbUrl = process.env.VITE_SUPABASE_URL || 'https://ugtsqlhkyrjmmopakyho.supabase.co';
  const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  try {
    const response = await fetch(
      `${sbUrl}/rest/v1/knowledge_base?instance_name=eq.${encodeURIComponent(instanceName)}&status=eq.active&select=file_name,extracted_text&order=created_at.desc`,
      {
        headers: {
          'apikey': sbKey,
          'Authorization': `Bearer ${sbKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Supabase error: ${response.statusText}`);
    }

    const files = await response.json();

    if (!files || files.length === 0) {
      return res.status(200).json({
        success: true,
        knowledgeText: '',
        fileCount: 0,
        files: []
      });
    }

    const knowledgeText = files
      .map((f, i) => `[Documento ${i + 1}: ${f.file_name}]\n${f.extracted_text}`)
      .join('\n\n---\n\n');

    return res.status(200).json({
      success: true,
      knowledgeText,
      fileCount: files.length,
      files: files.map(f => ({ name: f.file_name, size: f.extracted_text.length }))
    });

  } catch (error) {
    console.error('Knowledge Base fetch error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      knowledgeText: ''
    });
  }
}
