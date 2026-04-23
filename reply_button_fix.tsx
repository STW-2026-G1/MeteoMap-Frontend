{/* Botón de responder */}
<Button
   size="sm"
   variant="ghost"
   className="h-6 px-2 gap-1 text-gray-500 hover:text-blue-600 transition-colors"
   onClick={() => {
      setReplyingTo(replyingTo === comment.id ? null : comment.id);
      setReplyText("");
   }}
   title="Responder a este comentario"
>
   <MessageCircle className="h-3 w-3" />
   <span className="text-xs">Responder</span>
</Button>

{/* Reply Input */}
{replyingTo === comment.id && (
  <div className="mt-3 ml-11 border-l-2 border-blue-300 pl-3">
    <Textarea
      placeholder="Escribe tu respuesta..."
      value={replyText}
      onChange={(e) => setReplyText(e.target.value)}
      rows={2}
      className="mb-2 resize-none text-sm"
    />
    <div className="flex gap-2 justify-end">
      <Button
        size="sm"
        variant="ghost"
        onClick={() => {
          setReplyingTo(null);
          setReplyText("");
        }}
      >
        Cancelar
      </Button>
      <Button
        size="sm"
        className="bg-blue-600 hover:bg-blue-700"
        onClick={() => handleAddReply(comment.id)}
        disabled={isSubmittingReply || !replyText.trim()}
      >
        {isSubmittingReply ? (
          <>
            <div className="h-3 w-3 rounded-full bg-white animate-spin mr-2" />
            Enviando...
          </>
        ) : (
          <>
            <Send className="h-3 w-3 mr-1" />
            Responder
          </>
        )}
      </Button>
    </div>
  </div>
)}
