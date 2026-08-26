# EC2 instance — disabled when ec2_ami_id is not set
resource "aws_instance" "app" {
  count = 0

  ami                    = var.ec2_ami_id
  instance_type          = var.ec2_instance_type
  subnet_id              = aws_subnet.public[0].id
  vpc_security_group_ids = [aws_security_group.app.id]
  key_name               = var.ec2_key_name != "" ? var.ec2_key_name : null
  iam_instance_profile   = aws_iam_instance_profile.ec2.name

  user_data = base64encode(<<-EOT
    #!/bin/bash
    set -e

    # Install Docker
    dnf update -y
    dnf install -y docker
    systemctl enable --now docker
    usermod -aG docker ec2-user

    # Install AWS CLI v2
    curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o awscliv2.zip
    unzip awscliv2.zip
    ./aws/install

    # Create env file directory
    mkdir -p /opt/cloudtodo
    chmod 700 /opt/cloudtodo

    echo "EC2 bootstrap complete. Place .env at /opt/cloudtodo/.env then deploy."
  EOT
  )

  root_block_device {
    volume_type = "gp3"
    volume_size = 20
    encrypted   = true
  }

  tags = { Name = "${var.app_name}-${var.environment}" }
}
