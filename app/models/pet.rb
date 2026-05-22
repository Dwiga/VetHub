class Pet < ApplicationRecord
  audited

  belongs_to :species
  belongs_to :user, optional: true
  has_many :monitorings, dependent: :destroy

  validates :owner_phone, presence: true

  before_validation :normalize_owner_phone
  before_validation :link_user_by_phone, if: -> { owner_phone.present? && user_id.nil? }

  enum :gender, { unknown: 0, male: 1, female: 2 }
  enum :status, { healthy: 0, sick: 1, dead: 2, hospitalized: 3 }

  def age
    return "Unknown" unless birth_date

    years = Time.now.year - birth_date.year
    months = Time.now.month - birth_date.month

    if months < 0
      years -= 1
      months += 12
    end

    if years > 0
      "#{years} Tahun, #{months} Bulan"
    else
      "#{months} Bulan"
    end
  end

  def as_json(options = {})
    super(options).merge({
      species: species&.name,
      age: age
    })
  end

  private

  def normalize_owner_phone
    self.owner_phone = PhoneNumber.normalize(owner_phone) if owner_phone.present?
  end

  def link_user_by_phone
    self.user = User.find_by(phone_number: owner_phone)
  end
end
