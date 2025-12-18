use affine_common::doc_parser::{self, BlockInfo, CrawlResult, MarkdownResult};
use napi::bindgen_prelude::*;
use napi_derive::napi;

#[napi(object)]
pub struct NativeMarkdownResult {
  pub title: String,
  pub markdown: String,
}

impl From<MarkdownResult> for NativeMarkdownResult {
  /// Creates a NativeMarkdownResult from a MarkdownResult.
  ///
  /// # Examples
  ///
  /// ```
  /// let mr = MarkdownResult { title: "t".into(), markdown: "md".into() };
  /// let n: NativeMarkdownResult = NativeMarkdownResult::from(mr);
  /// assert_eq!(n.title, "t");
  /// assert_eq!(n.markdown, "md");
  /// ```
  fn from(result: MarkdownResult) -> Self {
    Self {
      title: result.title,
      markdown: result.markdown,
    }
  }
}

#[napi(object)]
pub struct NativeBlockInfo {
  pub block_id: String,
  pub flavour: String,
  pub content: Option<Vec<String>>,
  pub blob: Option<Vec<String>>,
  pub ref_doc_id: Option<Vec<String>>,
  pub ref_info: Option<Vec<String>>,
  pub parent_flavour: Option<String>,
  pub parent_block_id: Option<String>,
  pub additional: Option<String>,
}

impl From<BlockInfo> for NativeBlockInfo {
  /// Constructs a `NativeBlockInfo` from a `BlockInfo`.
  ///
  /// # Examples
  ///
  /// ```
  /// use affine_common::doc_parser::BlockInfo;
  /// use crate::NativeBlockInfo;
  ///
  /// let info = BlockInfo {
  ///     block_id: String::new(),
  ///     flavour: String::new(),
  ///     content: None,
  ///     blob: None,
  ///     ref_doc_id: None,
  ///     ref_info: None,
  ///     parent_flavour: None,
  ///     parent_block_id: None,
  ///     additional: None,
  /// };
  ///
  /// let native: NativeBlockInfo = NativeBlockInfo::from(info);
  /// ```
  fn from(info: BlockInfo) -> Self {
    Self {
      block_id: info.block_id,
      flavour: info.flavour,
      content: info.content,
      blob: info.blob,
      ref_doc_id: info.ref_doc_id,
      ref_info: info.ref_info,
      parent_flavour: info.parent_flavour,
      parent_block_id: info.parent_block_id,
      additional: info.additional,
    }
  }
}

#[napi(object)]
pub struct NativeCrawlResult {
  pub blocks: Vec<NativeBlockInfo>,
  pub title: String,
  pub summary: String,
}

impl From<CrawlResult> for NativeCrawlResult {
  /// Converts a `CrawlResult` into a `NativeCrawlResult`.
  ///
  /// The conversion maps `blocks` into `NativeBlockInfo` items and copies `title` and `summary`
  /// into the native representation exposed to JavaScript.
  ///
  /// # Examples
  ///
  /// ```
  /// // given a `crawl_result: CrawlResult`
  /// let native: NativeCrawlResult = crawl_result.into();
  /// assert_eq!(native.title, crawl_result.title);
  /// assert_eq!(native.summary, crawl_result.summary);
  /// ```
  fn from(result: CrawlResult) -> Self {
    Self {
      blocks: result.blocks.into_iter().map(Into::into).collect(),
      title: result.title,
      summary: result.summary,
    }
  }
}

/// Parse a binary document into a NativeCrawlResult suitable for JavaScript consumption.
///
/// On failure, returns a `napi::Error` with `Status::GenericFailure` describing the parse error.
///
/// # Returns
///
/// `NativeCrawlResult` with parsed `blocks`, `title`, and `summary`.
///
/// # Examples
///
/// ```
/// use napi::bindgen_prelude::Buffer;
///
/// // `doc_bin` should contain the binary document bytes and `doc_id` its identifier.
/// let doc_bin = Buffer::from(vec![/* ...document bytes... */]);
/// let doc_id = "example-doc-id".to_string();
///
/// let result = parse_doc_from_binary(doc_bin, doc_id).expect("parsing should succeed");
/// assert!(!result.title.is_empty());
/// ```
#[napi]
pub fn parse_doc_from_binary(doc_bin: Buffer, doc_id: String) -> Result<NativeCrawlResult> {
  let result = doc_parser::parse_doc_from_binary(doc_bin.into(), doc_id)
    .map_err(|e| Error::new(Status::GenericFailure, e.to_string()))?;
  Ok(result.into())
}

/// Converts a serialized document into a markdown result exposed to JavaScript.
///
/// The function parses the provided binary document and returns its title and
/// Markdown representation. The `ai_editable` flag toggles AI-editable output
/// formatting when supported by the parser.
///
/// # Parameters
///
/// * `ai_editable` - When `Some(true)`, request AI-editable markdown formatting; when `None` or `Some(false)`, return standard markdown.
///
/// # Returns
///
/// `NativeMarkdownResult` containing the parsed document `title` and `markdown` content.
///
/// # Examples
///
/// ```
/// use napi::bindgen_prelude::Buffer;
///
/// // Binary document bytes (example)
/// let doc_bin = Buffer::from(vec![/* ... document bytes ... */]);
/// let result = parse_doc_to_markdown(doc_bin, "doc-id-123".to_string(), None).unwrap();
/// println!("{}", result.title);
/// println!("{}", result.markdown);
/// ```
#[napi]
pub fn parse_doc_to_markdown(
  doc_bin: Buffer,
  doc_id: String,
  ai_editable: Option<bool>,
) -> Result<NativeMarkdownResult> {
  let result =
    doc_parser::parse_doc_to_markdown(doc_bin.into(), doc_id, ai_editable.unwrap_or(false))
      .map_err(|e| Error::new(Status::GenericFailure, e.to_string()))?;
  Ok(result.into())
}

/// Extracts all document IDs contained in a binary root document.
///
/// If `include_trash` is `true`, IDs for trashed documents are included; otherwise trashed IDs are excluded.
///
/// # Returns
///
/// A `Vec<String>` with the document IDs discovered in the root document.
///
/// # Examples
///
/// ```
/// use napi::bindgen_prelude::Buffer;
///
/// // `data` should contain the binary root document.
/// let data: Vec<u8> = vec![];
/// let buf = Buffer::from(data);
/// let ids = read_all_doc_ids_from_root_doc(buf, None).unwrap();
/// // All returned IDs are non-empty strings.
/// assert!(ids.iter().all(|s| !s.is_empty()));
/// ```
#[napi]
pub fn read_all_doc_ids_from_root_doc(
  doc_bin: Buffer,
  include_trash: Option<bool>,
) -> Result<Vec<String>> {
  let result = doc_parser::get_doc_ids_from_binary(doc_bin.into(), include_trash.unwrap_or(false))
    .map_err(|e| Error::new(Status::GenericFailure, e.to_string()))?;
  Ok(result)
}