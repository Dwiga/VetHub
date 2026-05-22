class User < ApplicationRecord
  rolify
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable,
         authentication_keys: [ :phone_number ]
  has_many :pets, foreign_key: :user_id, dependent: :destroy
  belongs_to :vet, foreign_key: :vet_id, dependent: :destroy, optional: true
  enum :vet_role, { administrator: 0, doctor: 1, nurse: 2, employee: 3 }

  before_validation :normalize_phone_number
  after_create :assign_default_role
  after_create :claim_unowned_pets

  def assign_default_role
    self.add_role(:user) if self.roles.blank?
  end
  # owner, user

  def email_required?
    false
  end

  private

  def normalize_phone_number
    self.phone_number = PhoneNumber.normalize(phone_number) if phone_number.present?
  end

  def claim_unowned_pets
    Pet.where(owner_phone: phone_number, user_id: nil).update_all(user_id: id)
  end
end
