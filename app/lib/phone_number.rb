module PhoneNumber
  module_function

  def normalize(raw)
    return nil if raw.blank?

    digits = raw.to_s.gsub(/\D/, "")
    return nil if digits.empty?

    if digits.start_with?("0")
      "62" + digits[1..]
    elsif digits.start_with?("62")
      digits
    else
      "62" + digits
    end
  end
end
